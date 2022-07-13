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
    let sessionId = SessionIdVal();
    ScanPage(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET, data.quantity, sessionId);
});


async function ScanPage(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000, quantity = 1, sessionId) {

    let itemIdMatch = document.documentElement.outerHTML.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/);
    if (itemIdMatch === null) return;
    let item_id = itemIdMatch["1"];
    appId = window.location.href.split("/").slice(-2)[0];
    let hashName = GetMarketHashNname();
    if (hashName === '') return;
    let hashNameUrl = fixedEncodeURIComponent(hashName);
    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, scanIntervalSET, errorPauseSET));
    let priceHistory = await getItemHistory(appId, hashNameUrl, selectLang);
    calculationFunction(priceJSON, priceHistory, { appId, hashName, hashNameUrl, item_id }, { coefficient, selectLang, CountRequesrs, scanIntervalSET, errorPauseSET, quantity }, sessionId);

}

function calculationFunction(priceJSON, priceHistory, item_description, extensionSetings, sessionId) {

    let { quantity } = extensionSetings;

    //listProfitCalculation() {actualProfit: "...." - прибыль в данный момент, coefPrice: "...." - прибыль для коэфицента, realPrice: "...." цена без комисии}
    myNextBuyPrice = NextPrice(priceJSON.highest_buy_order, "higest");
    displayProfitable(priceJSON, priceHistory, item_description, myNextBuyPrice, quantity, extensionSetings, sessionId);
}

function displayProfitable(priceJSON, priceHistory, item_description, myNextBuyPrice, quantityWant, extensionSetings, sessionId) {

    let itemProfit = listProfitCalculation(priceJSON, extensionSetings.coefficient);
    let { item_id } = item_description;
    let { countSell, countSellSevenDays, historyPriceJSON } = priceHistory;
    let minMaxPricePerDayVal = historyPriceJSON.prices;
    console.log(historyPriceJSON.prices);
    console.log(minMaxPricePerDayVal);
    let itemDescriptionDiv = document.getElementById("largeiteminfo_game_info");
    let itemInfoDiv = document.getElementById("largeiteminfo");

    DomRemove(document.getElementById(`chart_${item_id}`));
    historyChart(itemInfoDiv, item_id);

    DomRemove(document.getElementsByClassName(`order_block_${item_id}`)[0]);
    itemOrderChange(itemDescriptionDiv, item_description, myNextBuyPrice, quantityWant, extensionSetings, minMaxPricePerDayVal, sessionId);

    DomRemove(document.getElementsByClassName("displayProfitable")[0]);
    displayProfitableBlock(itemDescriptionDiv, itemProfit);

    DomRemove(document.getElementById("diagram_history"));
    diagramHistory(itemInfoDiv, item_description);

}

function displayProfitableBlock(itemDescriptionDiv, itemProfit) {
    let { actualProfit, coefPrice, realPrice } = itemProfit;
    if (realPrice !== undefined && actualProfit !== undefined && coefPrice !== undefined && itemDescriptionDiv !== null) {
        let itemProfitInfo = `
        <div class="displayProfitable">
        <span>${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPrice}</span>
        <br>
        <span>${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}</span>
        <br>
        <span>${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")}${coefPrice}</span>
        <br>
        </div>
        `;
        itemDescriptionDiv.insertAdjacentHTML('afterend', DOMPurify.sanitize(itemProfitInfo));
    }
}

function diagramHistory(itemInfoDiv, item_description) {
    let { appId, hashNameUrl } = item_description;
    if (appId !== undefined && hashNameUrl !== undefined && itemInfoDiv !== null) {
        let itemDiagramHistory = `<div id="diagram_history"></div>`;
        itemInfoDiv.insertAdjacentHTML('afterend', DOMPurify.sanitize(itemDiagramHistory));
        /* showHistory(appId, hashNameUrl); */
    }
}

function itemOrderChange(myListingBuyUpdateDom, item_description, myNextBuyPrice, quantityWant, extensionSetings, minMaxPricePerDayVal, sessionId) {

    if (myListingBuyUpdateDom === undefined || myListingBuyUpdateDom === null) return;
    let { item_id } = item_description;
            if (minMaxPricePerDayVal !== undefined && minMaxPricePerDayVal.length > 1) {
                /* schemeHistory(minMaxPricePerDayVal, item_id); */
                showHistoryChart(minMaxPricePerDayVal, item_id);
        }
    
    let myListingBuyUpdateHTML = `
    <span class="market_search_sidebar_contents change_price_search  market_table_value change_price_block order_block_${item_id}"
    style ="box-shadow: rgb(62 70 55 / 59%) 0px 0px 32px 38px inset; width: 100%; display: inline-block; margin-bottom: 14px;">
        <span id="myItemRealBuyPrice${item_id}">${myNextBuyPrice.nextPriceWithoutFee}</span>
        <span id="myItemNextBuyPrice${item_id}">${myNextBuyPrice.myNextPrice}</span>
        <input type="number" step="0.01" id="myItemBuyPrice${item_id}" class="change_price_input">
        <input type="number" id="myItemQuality${item_id}" class="change_price_input">
        <button id="cancelBuyOrder_${item_id}" class = "market_searchedForTerm"> ⦸ </button>
        <button id="createBuyOrder_${item_id}" class = "market_searchedForTerm"> ⨭ </button>
        <div class ="orderMessageBlock">
        <div id="responceServerRequestBuyOrder_${item_id}"></div>
        </div>
        
    </span>`;
    myListingBuyUpdateDom.insertAdjacentHTML('beforebegin', DOMPurify.sanitize(myListingBuyUpdateHTML));
    let buttonCancelBuy = document.getElementById(`cancelBuyOrder_${item_id}`);
    let buttonCreateBuy = document.getElementById(`createBuyOrder_${item_id}`);
    let myNextItemBuyPrice = document.getElementById(`myItemBuyPrice${item_id}`);
    let myItemQuality = document.getElementById(`myItemQuality${item_id}`);
    let myItemRealBuyPrice = document.getElementById(`myItemRealBuyPrice${item_id}`);
    let myItemNextBuyPrice = document.getElementById(`myItemNextBuyPrice${item_id}`);
    myNextItemBuyPrice.value = myNextBuyPrice.myNextPrice;
    myItemQuality.value = quantityWant;
    myNextItemBuyPrice.onchange = () => {
        myItemRealBuyPrice.textContent = myNextItemBuyPrice.value ? NextPrice((myNextItemBuyPrice.value * 100).toFixed(), "real").nextPriceWithoutFee : '';
        myItemNextBuyPrice.textContent = myNextItemBuyPrice.value ? NextPrice((myNextItemBuyPrice.value * 100).toFixed(), "real").myNextPrice : '';
    };
    buttonCreateBuy.addEventListener("click", (event) => { createBuyOrder(extensionSetings, sessionId, item_description); });
    buttonCancelBuy.addEventListener("click", (event) => { cancelBuyOrder(extensionSetings, sessionId, item_description); });
}

/**
 * Возвращает список заказов на покупку
 * @param {object} extensionSetings // обект настроек для запроса к серверу
 * @returns {Array} // массив обектов ордеров на покупку
 */
async function getMyBuyListing(extensionSetings) {
    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
    let myListings = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/mylistings/?norender=1', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
    return myListings.buy_orders;
}

/**
 * Отмена ордера на покупку
 * @param {object} extensionSetings // обект настроек для запроса к серверу
 * @param {Text} sessionId текущая сесия страницы
 * @param {Object} item_description // данные предмета {item_id - уникальный идентификатор, asset_description - JSON данные предмета}
 */
async function cancelBuyOrder(extensionSetings, sessionId, item_description) {

    let { appId, hashName, item_id } = item_description;

    let orderListArr = await getMyBuyListing(extensionSetings);
    console.log(orderListArr);
    if (appId !== null && appId !== undefined && hashName && item_id !== null && item_id !== undefined) {
        let itemInfo = orderListArr.filter(item => item.hash_name === hashName && item.appid === +appId)[0];
        let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
        console.log(itemInfo);
        if (itemInfo) {
            if (Object.entries(itemInfo).length === 8) {
                let orderId = itemInfo.buy_orderid;
                console.log(orderId);
                if (orderId !== null && sessionId !== null) {
                    let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
                    let url = "https://steamcommunity.com/market/cancelbuyorder/";
                    let serverResponse = await globalThis.httpPostErrorPause(url, params);
                    /*                             let steamItemBlock = document.getElementsByClassName(`order_block_${item_id}`)[0].nextSibling;
                                                steamItemBlock.style.borderLeft = (serverResponse.success === 1) ? "none" : "10px solid #136661"; */
                    htmlResponce.textContent = (serverResponse.success === 1) ? "Done cancel" : "Error cancel"; /* {success: 1} */
                }
            } else {
                htmlResponce.textContent = "Buy Order does not exist";
            }
        }
    }

}

/**
 * Создание ордера лоя покупки
 * @param {object} extensionSetings // обект настроек для запроса к серверу
 * @param {Text} sessionId текущая сесия страницы
 * @param {Object} item_description // данные предмета {item_id - уникальный идентификатор, asset_description - JSON данные предмета}
 * @returns 
 */
async function createBuyOrder(extensionSetings, sessionId, item_description) {
    let { appId, hashName, hashNameUrl, item_id } = item_description;
    hashName = fixedEncodeURIComponent(hashName);
    let inputPriceDom = document.getElementById(`myItemBuyPrice${item_id}`);
    let itemCountDom = document.getElementById(`myItemQuality${item_id}`);

    if (inputPriceDom.value.trim() == '' || itemCountDom.value.trim() == '' || itemCountDom.value.trim() <= 0) {
        if (document.getElementById(`error${item_id}`)) return;
        let error = document.createElement('p');
        error.innerText = "input value";
        error.id = `error${item_id}`;
        itemCountDom.after(error);
        return;
    }
    let inputPrice = inputPriceDom.value.trim();
    let itemCount = itemCountDom.value.trim();
    if (appId !== null && appId !== undefined && hashName && hashNameUrl && item_id !== null && item_id !== undefined) {
        let params = `sessionid=${sessionId}&currency=1&appid=${appId}&market_hash_name=${hashName}&price_total=${Math.round(inputPrice * 100 * itemCount)}&quantity=${itemCount}&billing_state=&save_my_address=0`;
        let url = "https://steamcommunity.com/market/createbuyorder/";
        let serverResponse = await globalThis.httpPostErrorPause(url, params);
        let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
        if (serverResponse.success === 1) {
            htmlResponce.textContent = "Order created";
            /*                     let steamItemBlock = document.getElementsByClassName(`order_block_${item_id}`)[0].nextSibling;
                                steamItemBlock.style.borderLeft = "10px solid #136661"; */
            //<div class="market_listing_row market_recent_listing_row" id="mybuyorder_4157921926" style="background-color: rgb(96, 55, 62);"></div>
            myNextBuyPrice = NextPrice((inputPrice * 100).toFixed(), "real");
            await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + extensionSetings.selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));

            let priceHistory = await getItemHistory(appId, hashNameUrl, extensionSetings.selectLang);
            displayProfitable(priceJSON, priceHistory, item_description, myNextBuyPrice, itemCount, extensionSetings, sessionId);
        }
        htmlResponce.textContent = (serverResponse.success === 29) ? serverResponse.message : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
    }



}


