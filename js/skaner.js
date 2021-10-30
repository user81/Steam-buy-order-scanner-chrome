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
    "run",
    "quantityItemsInHistory",
	
], function (data) {
    console.log(data.run);
    if (data.run) {
        startScan(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET);
    }
    showHistory(data.quantityItemsInHistory);
});

/**
 * 
 * Основной скрипт для сканирования
 * 
 * @param {Float} coefficient  коэфицент для вычисления цены
 * @param {string} selectLang язык который будет использоваться для запроса запроса 
 * @param {number} CountRequesrs количество повторений в запросе
 * @param {number} scanIntervalSET пауза между запросами
 * @param {number} errorPauseSET пауза между ошибками
 * @returns 
 */
async function startScan(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000) {
    console.log(coefficient, selectLang, CountRequesrs, scanIntervalSET, errorPauseSET);
    console.log(JSON.parse(await globalThis.httpErrorPause("https://steamcommunity.com/market/mylistings/?norender=1", CountRequesrs, scanIntervalSET, errorPauseSET)));
    var arrMyPriceLink = [];
    let myListings = JSON.parse(await globalThis.httpErrorPause("https://steamcommunity.com/market/mylistings/?norender=1", CountRequesrs, scanIntervalSET, errorPauseSET));
    var orderListJson = myListings.buy_orders;
    let marketItems = document.getElementsByClassName("market_listing_row market_recent_listing_row");
    let orderList = [];
    for (let marketItem of marketItems) {
        if (marketItem.id.includes("mybuyorder_") && window.getComputedStyle(marketItem).display === "block") {
            orderList.push(marketItem);
        }
    }
    if (orderList.length > 0) {
        for (let index = 0; index < orderList.length; index++) {
            let orderlink = orderList[index].getElementsByClassName('market_listing_item_name_link')[0].href;
            let orderprice = +orderList[index].getElementsByClassName('market_listing_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
            arrMyPriceLink.push([orderprice, orderlink]);
        }
    } else {
        return false;
    }

    if (orderListJson.length > 0 && orderListJson.length === arrMyPriceLink.length) {
        for (let orderKey = 0; orderKey < orderListJson.length; orderKey++) {
            var appId = orderListJson[orderKey].appid;
            var buyOrderId = orderListJson[orderKey].buy_orderid;
            var hashName = orderListJson[orderKey].hash_name;

            var orderHref = arrMyPriceLink[orderKey][1];
            var orderPrice = arrMyPriceLink[orderKey][0];
            let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
            let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
            let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
            InterVal(priceJSON, +buyOrderId, orderPrice, coefficient, item_id);
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
        }
    }
}

function InterVal(priceJSON, buyOrderId, MyBuyOrderPrice, coefficient = 0.35, item_id) {
    let currentOrder = document.querySelector(' [id ="mybuyorder_' + buyOrderId + '"]');
    let actualProfit = "Nan";
    let myProfit = "Nan";
    let coefPrice = "Nan";
    let MycoefPrice = "Nan";
    let realPrice = "Nan";
    var priceWithoutFee = null;

    if (priceJSON.lowest_sell_order !== null) {
        var inputValue = GetPriceValueAsInt(getNumber(`${priceJSON.lowest_sell_order/100}`));
        var nAmount = inputValue;

        if (inputValue > 0 && nAmount == parseInt(nAmount)) {
            var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nAmount = nAmount - feeInfo.fees;
            //priceWithoutFee цена без комиссии
            priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
            console.log(priceWithoutFee);
        }

        realPrice = getNumber(priceWithoutFee);
        console.log(priceWithoutFee);
        actualProfit = (realPrice - priceJSON.highest_buy_order/100).toFixed(2);
        myProfit = (realPrice - MyBuyOrderPrice).toFixed(2);
        coefPrice = ((priceJSON.highest_buy_order/100) * coefficient).toFixed(2);
        //
        MycoefPrice = (MyBuyOrderPrice * coefficient).toFixed(2);
    }

    let realPriceString = `${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPrice}`;
    let actualProfitString = `${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}`;
    let coefPriceString = `${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")} ${coefPrice}`;
    let myProfitString = `${chrome.i18n.getMessage("myProfitDescription")} ${myProfit}`;
    let MycoefPriceString = `${chrome.i18n.getMessage("myCoefficientPriceDescription")} ${MycoefPrice}`;

    let divOrderTable = document.createElement('div');// блок
    let divPriceTable = document.createElement('div'); // таблица цен
    let divString =  document.createElement('div'); //блок где встраиваются стоки
    let pRealPriceString = document.createElement('p');
    let pActualProfitString = document.createElement('p');
    let pCoefPriceString = document.createElement('p');
    let pMyProfitString = document.createElement('p');
    let pMycoefPriceString = document.createElement('p');
    divOrderTable.id = `orderTable`;
    divPriceTable.id = `priceTable${item_id}`;
    pRealPriceString.innerText = realPriceString;
    pActualProfitString.innerText = actualProfitString;
    pCoefPriceString.innerText = coefPriceString;
    pMyProfitString.innerText = myProfitString;
    pMycoefPriceString.innerText = MycoefPriceString;
    
    divString.append(pRealPriceString);
    divString.append(pActualProfitString);
    divString.append(pCoefPriceString);
    divString.append(pMyProfitString);
    divString.append(pMycoefPriceString);
    divOrderTable.append(divPriceTable);
    divOrderTable.append(divString);
    currentOrder.append(divOrderTable);

    let classesBuyOrders = [ 'my_listing_section', 'market_listing_row' ];
    divPriceTable.classList.add(...classesBuyOrders);
    divString.classList.add(...classesBuyOrders);
    divOrderTable.classList.add(...classesBuyOrders);

    const OrderTable = priceJSON.sell_order_table + priceJSON.buy_order_table;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(OrderTable, `text/html`);
    const tags = parsed.getElementsByTagName(`body`);
    for (const tag of tags) {
        document.getElementById(`priceTable${item_id}`).prepend(tag);
    }
    let style = `
    white-space: initial; 
    float: left; 
    padding: 2px; 
    display: flex; 
    width: 100%; 
    margin-top: 6px;`;
    currentOrder.style.cssText = `background-color: ${Color(priceJSON.highest_buy_order/100, MyBuyOrderPrice, actualProfit, myProfit, coefPrice, MycoefPrice)}`;
    divOrderTable.style.cssText = `${style} background-color: ${Color(priceJSON.highest_buy_order/100, MyBuyOrderPrice, actualProfit, myProfit, coefPrice, MycoefPrice)}`;

}

function Color(JSONbuy_order, MyBuyOrderPrice, actualProfit, myProfit, coefPrice, MycoefPrice) {
    if (JSONbuy_order.length != 0) {
        if (actualProfit == "Nan" || myProfit == "Nan" || coefPrice == "Nan" || MycoefPrice == "Nan") {
            return '#000732;'; //blue неизвестно
        }
        if (JSONbuy_order == MyBuyOrderPrice && actualProfit >= coefPrice) {
            return '#136f00;'; //green всё хорошо
        } else if (JSONbuy_order != MyBuyOrderPrice && actualProfit >= coefPrice) {
            return '#9c9b00;'; //yelow необходимо поменять цену
        } else if (JSONbuy_order != MyBuyOrderPrice && myProfit >= MycoefPrice) {
            return '#44007c;'; //violet моя цена актуальна
        } else {
            return '#6f0012;'; //red необходимо поменять
        }
    } return '#000732;';
}
