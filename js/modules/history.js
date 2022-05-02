/**
 *  Steam buy order scanner - is browser extension which to keep your Steam buy Market orders profitable.
 *  https://github.com/user81/Steam-buy-order-scanner-chrome
 *  Copyright (C) 2021 Ermachenya Aleksandr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


chrome.storage.local.get([
	"scanIntervalSET",
	"errorPauseSET",
	"coefficient",
	"selectLang",
	"quantity",
	"displayHistory",
	"quantityItemsInHistory",

], function (data) {
	sessionId = SessionIdVal();
	console.log(sessionId);
	extensionSetings = {
		"scanIntervalSET": data.scanIntervalSET,
		"errorPauseSET": data.errorPauseSET,
		"coefficient": data.coefficient,
		"selectLang": data.selectLang,
		"quantityItemsInHistory": data.quantityItemsInHistory,
	};
	if (data.displayHistory) {
		MyCustomHistoryTable(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET, data.quantity, data.quantityItemsInHistory);
	}
	

});
// кнопка истории
let steamHistory = document.getElementById("tabMyMarketHistory");
let steamMyListings = document.getElementById("tabMyListings");

async function MyCustomHistoryTable(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000, quantity = 1, quantityItemsInHistory = 500) {

	let getHistorySizeJSON = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/myhistory/render/?query=&start=0&count=${quantityItemsInHistory}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
	let countLoaders = Math.ceil(getHistorySizeJSON.total_count / quantityItemsInHistory) - 1;
	let changeCountLoaders = (countLoaders < 0) ? 0 : countLoaders;
	let quantityItemsInHistoryOld = quantityItemsInHistory; //старый диапазон значений от которго необходимо получить
	await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));

	let BGTophistoryBlock = document.getElementById("myListings");
	let myListingsHistory = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/myhistory/render/?query=&start=0&count=${quantityItemsInHistory}`, CountRequesrs, scanIntervalSET, errorPauseSET));
	await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));

	let myCustomHistoryTable = `
	<div id= "myCustomHistoryTableId" class ="market_content_block my_listing_section market_home_listing_table">
		<h3 class="my_market_header">
			<span class="my_market_header_active">My History</span>
			<a id="addMyHistory" class="market_tab_well_tab market_tab_well_tab_active">
				<span class="market_custom_tab_well_tab_contents">
					Add History
					<span id="changeCountLoaders">(${changeCountLoaders})</span>
					<span id="quantityItemsInHistoryOld">(${quantityItemsInHistoryOld})</span>
				</span>
			</a>

			<a id="ReloadMyHistory" class="market_tab_well_tab market_tab_well_tab_active">
				<span class="market_custom_tab_well_tab_contents"> Reload </span>
			</a>
		</h3>
		<div id= "custom_results_html">
		${DOMPurify.sanitize(myListingsHistory.results_html)}
		</div>
	</div>
	`;
	BGTophistoryBlock.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(myCustomHistoryTable));

	// обработчик для загрузки следующей истории
	let addMyHistory = document.getElementById("addMyHistory");
	let countClickaddMyHistory = 1; // мы уже загризили 1 раз
	let quantityItemsInHistoryNext;
	addMyHistory.onclick = async function () {
		if (changeCountLoaders <= 0) return;
		++countClickaddMyHistory;
		quantityItemsInHistoryNext = (countClickaddMyHistory * quantityItemsInHistory).toFixed();
		console.log(quantityItemsInHistoryNext);
		let myListingsHistoryRange = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/myhistory/render/?query=&start=${quantityItemsInHistoryOld}&count=${quantityItemsInHistory}`, CountRequesrs, scanIntervalSET, errorPauseSET));
		await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
		let myCustomHistoryTableHTML = document.getElementById("custom_results_html");
		myCustomHistoryTableHTML.insertAdjacentHTML('beforeend', myListingsHistoryRange.results_html);
		quantityItemsInHistoryOld = quantityItemsInHistoryNext;
		--changeCountLoaders;
		document.getElementById("changeCountLoaders").textContent = `(${changeCountLoaders})`;
		document.getElementById("quantityItemsInHistoryOld").textContent = `(${quantityItemsInHistoryOld})`;
	}
	let ReloadMyHistory = document.getElementById("ReloadMyHistory");

	ReloadMyHistory.onclick = async function () {
	let myReloadListingsHistory = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/myhistory/render/?query=&start=0&count=${quantityItemsInHistory}`, CountRequesrs, scanIntervalSET, errorPauseSET));
	await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
	let myCustomHistoryTableHTML = document.getElementById("custom_results_html");
	myCustomHistoryTableHTML.innerHTML = DOMPurify.sanitize(myReloadListingsHistory.results_html);
	countClickaddMyHistory =1;
	changeCountLoaders = countLoaders;
	quantityItemsInHistoryOld = quantityItemsInHistory;
	document.getElementById("changeCountLoaders").textContent = `(${changeCountLoaders})`;
	document.getElementById("quantityItemsInHistoryOld").textContent = `(${quantityItemsInHistoryOld})`;
	}

/**
 * поиск в истории
 */
steamHistorySreach();
}



function steamHistorySreach() {
	let steamHistorySreachBlock = document.getElementById("myMarketTabs");
	if (document.getElementById('divMarketListingTableHeader') === null) {
		let divMarketListingTableHeader = `
	<div id="divMarketListingTableHeader" class="market_history_sreach">
		<input type="text" id="sreach-filter">
		<a id="displayNoneListingCanceledCreated" class="market_tab_well_tab">
			<span class="market_custom_tab_well_tab_contents">Clear</span>
		</a>
	</div>`;
		steamHistorySreachBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(divMarketListingTableHeader));
	}

	document.getElementById('sreach-filter').addEventListener('keyup', filterList);
	function filterList() {
		let count = 300;
		setTimeout(function tickInput() {
			let itemDetals = document.querySelectorAll(`div[id^="history_row"]`);
			if (itemDetals && count > 0) {
				let srch = document.getElementById('sreach-filter');
				let val = srch.value.toLowerCase();
				let valArr = val.split(' ');
				console.log(valArr);
				let historyTable = document.getElementById('sreach-filter');
				if (itemDetals.length > 0) {
					for (var i = 0; i < itemDetals.length; i++) {
						if (itemDetals[i].id.includes('event_1') || itemDetals[i].id.includes('event_2')) {
							document.getElementById(itemDetals[i].id).style.display = 'none';
						} else {
							document.getElementById(itemDetals[i].id).style.display = '';
						}

						for (var j = 0; j < valArr.length; j++) {
							if (document.getElementById(itemDetals[i].children[6].firstElementChild.id).innerText.toLowerCase().indexOf(valArr[j]) === -1) {
								document.getElementById(itemDetals[i].id).style.display = 'none';
							}
						}
					}
				}
				return;
			}
			count--;
			setTimeout(tickInput, 1000);
		}, 1000);
	}

	let DisplayNoneListing = document.getElementById("displayNoneListingCanceledCreated");
	DisplayNoneListing.onclick = function () {
		let itemDetals = document.querySelectorAll(`div[id^="history_row"]`);
		DisplayNoneListing.className = "market_tab_well_tab market_tab_well_tab_active";
		if (itemDetals.length > 0) {
			for (let i = 0; i < itemDetals.length; i++) {
				if (itemDetals[i].id.includes('event_1') || itemDetals[i].id.includes('event_2')) {
					document.getElementById(itemDetals[i].id).style.display = 'none';
				}
				else {
					document.getElementById(itemDetals[i].id).style.display = '';
				}
			}
		}
	};
}


steamHistory.onclick = function () {
	if (document.getElementById("myCustomHistoryTableId")) {
		document.getElementById("myCustomHistoryTableId").style.display = "none";
	}

	if (document.getElementById("divMarketListingTableHeader")) {
		document.getElementById("divMarketListingTableHeader").style.display = "none";
	}
}

steamMyListings.onclick = function () {
	if (document.getElementById('myCustomHistoryTableId')) {
		document.getElementById("myCustomHistoryTableId").style.display = "";
	}

	if (document.getElementById('divMarketListingTableHeader')) {
		document.getElementById("divMarketListingTableHeader").style.display = "";
	}
}



