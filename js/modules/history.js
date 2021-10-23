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

function showHistory(OrdersCount = 500) {
	let script;
	script = document.createElement('script');
	script.text = `
        var g_bBusyLoadingMarketHistory = false;
        var g_oMyHistory = null;
        function LoadMarketHistory()
        {
        	if ( g_bBusyLoadingMarketHistory )
        	{
        		return;
        	}
        
        	g_bBusyLoadingMarketHistory = true;
        	var elMyHistoryContents = $('tabContentsMyMarketHistory');
        	new Ajax.Request( 'https://steamcommunity.com/market/myhistory', {
        		method: 'get',
        		parameters: {
                    count:${OrdersCount}
        		},
        		onSuccess: function( transport ) {
        			if ( transport.responseJSON )
        			{
        				var response = transport.responseJSON;
                    
        				elMyHistoryContents.innerHTML = response.results_html;
                    
        				MergeWithAssetArray( response.assets );
        				eval( response.hovers );
                    
        				g_oMyHistory = new CAjaxPagingControls(
        						{
        							query: '',
        							total_count: response.total_count,
        							pagesize: response.pagesize,
        							prefix: 'tabContentsMyMarketHistory',
        							class_prefix: 'market'
        						}, 'https://steamcommunity.com/market/myhistory/'
        				);
                            
        				g_oMyHistory.SetResponseHandler( function( response ) {
        					MergeWithAssetArray( response.assets );
        					eval( response.hovers );
        				});
        			}
        		},
        		onComplete: function() { g_bBusyLoadingMarketHistory = false; }
        	});
        }
        `;
	(document.head || document.documentElement).appendChild(script);
}

let steamHistory = document.getElementById("tabMyMarketHistory");
let steamHistorySreachBlock = document.getElementById("tabContentsMyMarketHistory");
steamHistory.onclick = function () {
	if (document.getElementById('divMarketListingTableHeader') === null) {
		let divMarketListingTableHeader = document.createElement('div');
		divMarketListingTableHeader.id = "divMarketListingTableHeader";

		let Search = document.createElement("INPUT");
		Search.setAttribute("type", "text");
		divMarketListingTableHeader.className = "market_listing_table_header";
		Search.id = "sreach-filter";
		divMarketListingTableHeader.append(Search);

		let aDisplayNoneListing = document.createElement('a');
		let spanDisplayNoneListing = document.createElement('span');
		aDisplayNoneListing.id = "displayNoneListingCanceledCreated";
		aDisplayNoneListing.className = "market_tab_well_tab";
		spanDisplayNoneListing.className = "market_tab_well_tab_contents";
		spanDisplayNoneListing.textContent = "Clear";
		aDisplayNoneListing.append(spanDisplayNoneListing);
		divMarketListingTableHeader.append(aDisplayNoneListing);

		steamHistorySreachBlock.before(divMarketListingTableHeader);
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



