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

changeSearchSize();
var g_rgWalletInfo = {
    wallet_fee: 1,
    wallet_fee_base: 0,
    wallet_fee_minimum: 1,
    wallet_fee_percent: 0.05,
    wallet_publisher_fee_percent_default: 0.10,
    wallet_currency: 1
};

chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
    "quantity",
], function (data) {
    displayProfit(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET, data.quantity);
});


async function displayProfit(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000, quantity = 1) {
    let item_id = document.documentElement.outerHTML.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
    console.log(item_id);
    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
    InterVal(priceJSON, coefficient, quantity);
}

function InterVal(priceJSON, coefficient = 0.35, quantity = 1) {
    let currentDiv = document.getElementById("largeiteminfo_item_descriptors");
    let actualProfit = "Nan";
    let coefPrice = "Nan";
    let realPrice = "Nan";
    var priceWithoutFee = null;
    if (priceJSON.lowest_sell_order !== null && priceJSON.highest_buy_order !== null) {
        var inputValue = GetPriceValueAsInt(getNumber(`${priceJSON.lowest_sell_order/100}`));
        var nAmount = inputValue;
        if (inputValue > 0 && nAmount == parseInt(nAmount)) {
            var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nAmount = nAmount - feeInfo.fees;

            priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
        }

        realPrice = getNumber(priceWithoutFee);
        actualProfit = (realPrice - priceJSON.highest_buy_order/100).toFixed(2);
        coefPrice = ((priceJSON.highest_buy_order/100) * coefficient).toFixed(2);
    }
    let realPriceString = `${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPrice}`;
    let actualProfitString = `${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}`;
    let coefPriceString = `${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")}${coefPrice}`;

    let divPricesList = document.createElement('div');
    let divRealPriceString = document.createElement('div');
    let divActualProfitString = document.createElement('div');
    let divCoefPriceString = document.createElement('div');
    divRealPriceString.innerText = realPriceString;
    divActualProfitString.innerText = actualProfitString;
    divCoefPriceString.innerText = coefPriceString;
    divPricesList.append(divRealPriceString);
    divPricesList.append(divActualProfitString);
    divPricesList.append(divCoefPriceString);
    currentDiv.prepend(divPricesList);

    let count = 60;

    let elementOrderPrice = document.getElementById("quick_order_price");
    ShowPrice(count);
    function ShowPrice(count = 60) {
        if (elementOrderPrice !== null) {
            if (elementOrderPrice.value === '') {
                setTimeout(function tick() {
                    if (elementOrderPrice && count > 0) {
                        elementOrderPrice.value = (priceJSON.highest_buy_order/100 + 0.01).toFixed(2);
                        document.getElementById("quick_order_qt").value = quantity;
                        return;
                    }
                    count--;
                    console.log('request' + count);
                    setTimeout(tick, 1000);
                }, 1000);
            }
        }
    }
    let buyButton;
    if (document.getElementsByClassName("market_commodity_buy_button").length > 0) {
        buyButton = document.getElementsByClassName("market_commodity_buy_button")[0];
    }else{
        buyButton = document.getElementsByClassName("market_noncommodity_buyorder_button")[0];
    }
    
    buyButton.addEventListener("click", function (event) {
        let buyPrice;
        let buyQuantity;
        let buyorderAccept;
        let muprice = (priceJSON.highest_buy_order/100 + 0.01).toFixed(2);
        setTimeout(function () {

            let buyInputBlock = document.getElementsByClassName("market_buy_commodity_input_block")[0];
            let elementOrderTable = document.getElementById("orderTable");

            if (elementOrderTable === null) {
                let divOrderTable = document.createElement('div');
                let divPriceTable = document.createElement('div');
                let divRealPriceString = document.createElement('p');
                let divActualProfitString = document.createElement('p');
                let divCoefPriceString = document.createElement('p');
                divOrderTable.id = "orderTable";
                divPriceTable.id = "priceTable";
                divOrderTable.style.cssText = `margin-left: -300px;margin-bottom: -100px`;
                divRealPriceString.innerText = realPriceString;
                divActualProfitString.innerText = actualProfitString;
                divCoefPriceString.innerText = coefPriceString;
                divOrderTable.append(divPriceTable);
                divOrderTable.append(divRealPriceString);
                divOrderTable.append(divActualProfitString);
                divOrderTable.append(divCoefPriceString);
                buyInputBlock.prepend(divOrderTable);
            
                const OrderTable = priceJSON.sell_order_table + priceJSON.buy_order_table;
                const parser = new DOMParser();
                const parsed = parser.parseFromString(OrderTable, `text/html`);
                const tags = parsed.getElementsByTagName(`body`);
                for (const tag of tags) {
                    document.getElementById(`priceTable`).prepend(tag);
                }
            }

            buyPrice = document.getElementById("market_buy_commodity_input_price");
            buyQuantity = document.getElementById("market_buy_commodity_input_quantity");
            buyorderAccept = document.getElementById("market_buyorder_dialog_accept_ssa");
            if (buyPrice === null || buyQuantity === null || buyorderAccept === null) {
                InputPrice(60, buyPrice, buyQuantity, buyorderAccept);
            }
            buyPrice.value = muprice;
            buyQuantity.value = quantity;
            buyorderAccept.checked = true;
            
        }, 1000);

        function InputPrice(count = 60, buyPrice, buyQuantity, buyorderAccept) {
                setTimeout(function tickInput() {
                    buyPrice = document.getElementById("market_buy_commodity_input_price");
                    buyQuantity = document.getElementById("market_buy_commodity_input_quantity");
                    buyorderAccept = document.getElementById("market_buyorder_dialog_accept_ssa");
                    if (count > 0 && buyPrice && buyQuantity && buyorderAccept) {
                        buyPrice.value = muprice;
                        buyQuantity.value = quantity;
                        buyorderAccept.checked = true;
                        return;
                    }
                    count--;
                    console.log('request' + count);
                    setTimeout(tickInput, 1000);
                }, 1000);
        }
    }); 

}


