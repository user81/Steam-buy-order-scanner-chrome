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

let scanInterval = document.getElementById("scanInterval");
let errorPause = document.getElementById("errorPause");
let coefficientHtml = document.getElementById("coefficient");
let checkboxRun = document.getElementById("run");
let save = document.getElementById("save");
let selectLang = document.getElementById("selectLang");
let quantity = document.getElementById("quantity");

let quantityItemsInHistory = document.getElementById("quantityItemsInHistory");

/**
 *! scanInterval.value получить окно и присвоить значение
 *! setings.autoscanSET 
 */

let scanIntervalSET;
let errorPauseSET;
let coefficient;

chrome.storage.local.get([
	"scanIntervalSET",
	"errorPauseSET",
	"coefficient",
	"quantity",
	"selectLang",
	"run",
	"quantityItemsInHistory",
],
	(setings) => {
		scanInterval.value = setings.scanIntervalSET;
		errorPause.value = setings.errorPauseSET;
		coefficientHtml.value = setings.coefficient;
		quantity.value = setings.quantity;
		checkboxRun.checked = setings.run;

		quantityItemsInHistory.value = ( setings.quantityItemsInHistory > 500 || setings.quantityItemsInHistory <= 0) ? 500 : setings.quantityItemsInHistory;

		for (let index = 0; index < selectLang.length; index++) {
			if (selectLang.options[index].value == setings.selectLang) {
				selectLang.options[index].selected = true;
			}
		}
	});

save.addEventListener("click", function () {
	quantityItemsInHistory.value = ( quantityItemsInHistory.value > 500 || quantityItemsInHistory.value <= 0) ? 500 : quantityItemsInHistory.value;
	chrome.storage.local.set({
		scanIntervalSET: scanInterval.value,
		errorPauseSET: errorPause.value,
		coefficient: coefficientHtml.value,
		quantity: quantity.value,
		selectLang: selectLang.selectedOptions[0].value,
		run: checkboxRun.checked,
		quantityItemsInHistory: quantityItemsInHistory.value,
	});
});







