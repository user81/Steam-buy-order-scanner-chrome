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

const setSetings = {
    scanIntervalSET: 1000,
    errorPauseSET: 5,
    coefficient : 0.35,
    selectLang : "english",
    quantity : 8,
    run : false,
    //history
    quantityItemsInHistory : 500,
    //-------

}

var scanIntervalSET = setSetings.scanIntervalSET;
var errorPauseSET = setSetings.errorPauseSET;
var coefficient = setSetings.coefficient;
var selectLang = setSetings.selectLang;
var quantity = setSetings.quantity; 
var run = setSetings.run;  
//history
var quantityItemsInHistory = setSetings.quantityItemsInHistory;
//-------

/**
 * !сохранили setSetings если  не в get
 */
 chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(Object.keys(setSetings),
        function (result) {
            for (const str in setSetings) {
                if (typeof result[str] == "undefined") {
                    chrome.storage.local.set({
                        [str]: setSetings[str],
                    },function() {
                        console.log('Value set' +  setSetings[str]);
                    });
                }
            }
        }
    );
});



