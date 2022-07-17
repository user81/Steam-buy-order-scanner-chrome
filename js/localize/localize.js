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

(function () {
    let data = document.querySelectorAll('[data-localize]');
    Array.prototype.map.call(data, (elementDom) => {
        let dataLocalizeValue = elementDom.getAttribute('data-localize').toString();
        let filterValue = replace_i18n(dataLocalizeValue).toString();
        if (filterValue != '' && chrome.i18n.getMessage(filterValue) != '') {
            elementDom.innerText = chrome.i18n.getMessage(filterValue);
        }
    });
}());

function replace_i18n(dataLocalizeValue) {
    let msg = dataLocalizeValue.replace(/__MSG_(\w+)__/g, function (value, filterValue) {
        if (value != filterValue) {
            return (filterValue) ? filterValue : '';
        }
        return '';
    });
    return (dataLocalizeValue != msg) ? msg : '';
}

let getLocalizeText = (filterValue, defaultText = '') => (chrome.i18n.getMessage(filterValue) != '') ? chrome.i18n.getMessage(filterValue) : defaultText;
