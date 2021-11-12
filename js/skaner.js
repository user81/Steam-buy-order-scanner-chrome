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
let sessionId;

chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
    "quantity",
    "run",
    "quantityItemsInHistory",
	
], function (data) {
    console.log(data.run);
    sessionId=SessionIdVal();
    console.log(sessionId);
    if (data.run) {
        startScan(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET, data.quantity);
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
async function startScan(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000, quantity = 1) {
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
            var appId = orderListJson[orderKey].appid; //753 id game
            var buyOrderId = orderListJson[orderKey].buy_orderid; // id заказа
            var hashName = orderListJson[orderKey].hash_name; //   489630-Lord Commissar (Foil Trading Card) 
            var walletCurrency = orderListJson[orderKey].wallet_currency; // 1
            var itemQuantity = orderListJson[orderKey].quantity; // количество 7 сколько было
            var itemQuantityRemaining = orderListJson[orderKey].quantity_remaining; // количество 5 сколько стало

            var orderHref = arrMyPriceLink[orderKey][1];
            var orderPrice = arrMyPriceLink[orderKey][0];
            let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
            let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
            let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
            InterVal(priceJSON, +buyOrderId, orderPrice, coefficient, item_id, appId, hashName, itemQuantity, itemQuantityRemaining, quantity);
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
        }
    }
}

function InterVal(priceJSON, buyOrderId, MyBuyOrderPrice, coefficient = 0.35, item_id, appId, hashName, itemQuantity, itemQuantityRemaining, quantity) {
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
        }

        realPrice = getNumber(priceWithoutFee);
        actualProfit = (realPrice - priceJSON.highest_buy_order/100).toFixed(2);
        myProfit = (realPrice - MyBuyOrderPrice).toFixed(2);
        coefPrice = ((priceJSON.highest_buy_order/100) * coefficient).toFixed(2);
        //
        MycoefPrice = (MyBuyOrderPrice * coefficient).toFixed(2);
    }
    var myNextPrice =  NextPrice(priceJSON.highest_buy_order);

    let realPriceString = `${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPrice}`;
    let actualProfitString = `${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}`;
    let coefPriceString = `${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")} ${coefPrice}`;
    let myProfitString = `${chrome.i18n.getMessage("myProfitDescription")} ${myProfit}`;
    let MycoefPriceString = `${chrome.i18n.getMessage("myCoefficientPriceDescription")} ${MycoefPrice}`;

    let divOrderTable = document.createElement('div');// блок
    let divPriceTable = document.createElement('div'); // таблица цен
    let divString =  document.createElement('div'); //блок где встраиваются стоки
    let divMyString =  document.createElement('div');
    let pRealPriceString = document.createElement('p');
    let pActualProfitString = document.createElement('p');
    let pCoefPriceString = document.createElement('p');
    let pMyProfitString = document.createElement('p');
    let pMycoefPriceString = document.createElement('p');
    let buttonCancelBuyOrder = document.createElement('button'); //кнопка отменить ордер
    let divCancelBuyOrderString =  document.createElement('div');//блок строк задания цен
    let inputItemPrice =  document.createElement('input');
    let inputItemQuality =  document.createElement('input');
    let buttonCreateBuyOrder = document.createElement('button'); //кнопка покупки
    let responceServerRequest = document.createElement('div'); 
    inputItemPrice.type = "number";
    inputItemQuality.type = "number";
    inputItemPrice.step = "0.01";
    divOrderTable.id = `orderTable`;
    divPriceTable.id = `priceTable${item_id}`;
    buttonCancelBuyOrder.id = `cancelBuyOrder_${item_id}`;
    inputItemPrice.id = `myItemPrice${item_id}`;
    inputItemQuality.id = `myItemQuality${item_id}`;
    buttonCreateBuyOrder.id = `createBuyOrder${item_id}`;
    responceServerRequest.id = `responceServerRequest_${item_id}`;
    pRealPriceString.innerText = realPriceString;
    pActualProfitString.innerText = actualProfitString;
    pCoefPriceString.innerText = coefPriceString;
    pMyProfitString.innerText = myProfitString;
    pMycoefPriceString.innerText = MycoefPriceString;
    buttonCancelBuyOrder.innerText = "⦸ Order";
    buttonCreateBuyOrder.innerText = "⨭ Order";
    inputItemPrice.value = myNextPrice.myNextPrice;
    inputItemQuality.value = quantity;
    buttonCancelBuyOrder.setAttribute("item_id", item_id);
    buttonCancelBuyOrder.setAttribute("buyOrderId", buyOrderId);
    buttonCreateBuyOrder.setAttribute("buyOrderId", buyOrderId);
    buttonCreateBuyOrder.setAttribute("appId", appId);
    buttonCreateBuyOrder.setAttribute("hashName", hashName);
    buttonCreateBuyOrder.setAttribute("item_id", item_id);

    buttonCancelBuyOrder.onclick = cancelBuyOrder;
    buttonCreateBuyOrder.onclick = createBuyOrder;
    divString.append(pRealPriceString);
    divString.append(pActualProfitString);
    divString.append(pCoefPriceString);
    divMyString.append(pMyProfitString);
    divMyString.append(pMycoefPriceString);
    divCancelBuyOrderString.append(inputItemPrice);
    divCancelBuyOrderString.append(inputItemQuality);
    divCancelBuyOrderString.append(buttonCancelBuyOrder);
    divCancelBuyOrderString.append(buttonCreateBuyOrder);
    divCancelBuyOrderString.append(responceServerRequest);
    divOrderTable.append(divPriceTable);
    divOrderTable.append(divString);
    divOrderTable.append(divMyString);
    divOrderTable.append(divCancelBuyOrderString);
    currentOrder.append(divOrderTable);

    let classesBuyOrders = [ 'my_listing_section', 'market_listing_row', 'min_size_table' ];
    let classesInput = [ 'create_buy_input' ];
    divPriceTable.classList.add(...classesBuyOrders);
    /* divString.classList.add(...classesBuyOrders); */
    /* divOrderTable.classList.add(...classesBuyOrders); */
    inputItemPrice.classList.add(...classesInput);
    inputItemQuality.classList.add(...classesInput);
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
            return '#1c563d;'; //green всё хорошо
        } else if (JSONbuy_order != MyBuyOrderPrice && actualProfit >= coefPrice) {
            return '#767631;'; //yelow необходимо поменять цену
        } else if (JSONbuy_order != MyBuyOrderPrice && myProfit >= MycoefPrice) {
            return '#554b5e;'; //violet моя цена актуальна
        } else {
            return '#60373e;'; //red необходимо поменять
        }
    } return '#000732;';
}

function NextPrice(lowestSellOrder) {
    if (lowestSellOrder === null) {
        nextPriceWithoutFee = 0.01;
        nextPriceWithoutFee = 0.03;
        return {nextPriceWithoutFee, myNextPrice};
    }
    var inputValue = GetPriceValueAsInt(getNumber(`${lowestSellOrder/100}`));

    var nAmount = inputValue;
    if (inputValue > 0 && nAmount == parseInt(nAmount)) {
        var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
        nAmount = nAmount - feeInfo.fees; // без комиссии
        priceWithoutFee = getNumber(v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));

        var nextPriceWithoutFee = priceWithoutFee; //nextPriceWithoutFee прибыль которая длжна меняться
        while (nextPriceWithoutFee == priceWithoutFee) {
            ++inputValue;
            var nextNAmount = inputValue;
            let nextFeeInfo = CalculateFeeAmount(nextNAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nextNAmount = nextNAmount - nextFeeInfo.fees;
            nextPriceWithoutFee = getNumber(v_currencyformat(nextNAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
            myNextPrice = getNumber(v_currencyformat(inputValue, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
            
        }
    }

    return {nextPriceWithoutFee, myNextPrice};
}

async function cancelBuyOrder() {
    let orderId = this.getAttribute("buyOrderId");
    let item_id = this.getAttribute("item_id");
    if(orderId !==null && sessionId !==null) {
        let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
        let url = "https://steamcommunity.com/market/cancelbuyorder/";
        let serverResponse = JSON.parse(await globalThis.httpPostErrorPause(url, params));
        let htmlResponce = document.getElementById(`responceServerRequest_${item_id}`);
        console.log(+serverResponse.success,  serverResponse.success, typeof serverResponse.success, htmlResponce);
        htmlResponce.textContent = (+serverResponse.success == 1) ?  "Done cancel" : "Error cancel"; /* {success: 1} */
    }   
}

async function createBuyOrder() {
    let appid = this.getAttribute("appid");
    let hashname = this.getAttribute("hashname");
    let item_id = this.getAttribute("item_id");
    let buttonHtmlAttribute = this.getAttribute("buyOrderId");
    let inputPriceDom = document.getElementById(`myItemPrice${item_id}`);
    let itemCountDom =document.getElementById(`myItemQuality${item_id}`);
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
    if(appid !== null && hashname !== null && item_id !== null) {
        let params = `sessionid=${sessionId}&currency=1&appid=${appid}&market_hash_name=${hashname}&price_total=${Math.round(inputPrice * 100 * itemCount)}&quantity=${itemCount}&billing_state=&save_my_address=0`;
        let url = "https://steamcommunity.com/market/createbuyorder/";
        let serverResponse = JSON.parse(await globalThis.httpPostErrorPause(url, params));
        console.log(serverResponse.success , +serverResponse.success, typeof serverResponse.success);
        let htmlResponce = document.getElementById(`responceServerRequest_${item_id}`);
        if (+serverResponse.success == 1) {
            document.getElementById(`cancelBuyOrder_${item_id}`).setAttribute("buyOrderId", +serverResponse.buy_orderid);
        }
        htmlResponce.textContent = (+serverResponse.success == 29) ? serverResponse.message : 
        (+serverResponse.success == 1) ? "Price updated" : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
    }
}

