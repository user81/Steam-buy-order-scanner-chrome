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
let extensionSetings;
let sessionId;
var orderListJson;
let orderListArr;
let buyOrderHeader = document.getElementsByClassName("market_listing_table_header")[1];
//headersNames массив элементов
let  headersNames =["Sells", "Pofit","Buy_tab", "Sell_tab", "Update",];
for (const key in headersNames) {
    var createHeader = document.createElement("span");
    createHeader.className = `market_listing_right_cell market_listing_my_price market_my_listing_${headersNames[key].toLowerCase()}`;
    createHeader.innerText = headersNames[key];
    buyOrderHeader.append(createHeader);
}

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
        extensionSetings = {
            "scanIntervalSET": data.scanIntervalSET,
            "errorPauseSET": data.errorPauseSET,
            "coefficient": data.coefficient,
            "selectLang": data.selectLang
        };
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
    
    var arrMyPriceLink = [];
    let myListings = JSON.parse(await globalThis.httpErrorPause("https://steamcommunity.com/market/mylistings/?norender=1", CountRequesrs, scanIntervalSET, errorPauseSET));
    orderListJson = myListings.buy_orders;
    orderListArr = Object.entries(orderListJson); // массив значений товаров
    let marketItems = document.getElementsByClassName("market_listing_row market_recent_listing_row");
    let orderList = [];
    let blockNames = headersNames.reverse();
    for (let marketItem of marketItems) {
        if (marketItem.id.includes("mybuyorder_") && window.getComputedStyle(marketItem).display === "block") {
            for (const key in blockNames) {
            countBlock = marketItem.getElementsByClassName("market_listing_buyorder_qty")[0];
            let myItemBlocksHTML = `<div class="market_listing_right_cell market_listing_my_price market_my_listing_${headersNames[key].toLowerCase()}"></div>`;
            let cleanMyItemBlocksHTML = DOMPurify.sanitize(myItemBlocksHTML);
            countBlock.insertAdjacentHTML('afterend', cleanMyItemBlocksHTML);
            }
        let orderlink = marketItem.getElementsByClassName('market_listing_item_name_link')[0].href;
        let orderprice = marketItem.getElementsByClassName('market_listing_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
        let myBuyorderId = marketItem.id.split('_')[1]; // 4078635920
        arrMyPriceLink.push([orderprice, orderlink, myBuyorderId]);
        }
    }

    if (orderListArr.length > 0 && orderListArr.length === arrMyPriceLink.length) {
        for (let orderKey = 0; orderKey < orderListArr.length; orderKey++) {
    
            let myBuyorder = arrMyPriceLink[orderKey][2];
            let orderHref = arrMyPriceLink[orderKey][1];
            let orderPrice = arrMyPriceLink[orderKey][0];

            let itemDetals = orderListArr.filter(item => item[1].buy_orderid === myBuyorder)[0]; //1 ключ 2 содержимое
            if (itemDetals.length === 2) {
                var appId = itemDetals[1].appid; //753 id game
                var buyOrderId = itemDetals[1].buy_orderid; // id заказа
                var hashName = itemDetals[1].hash_name; //   489630-Lord Commissar (Foil Trading Card) 
                var walletCurrency = itemDetals[1].wallet_currency; // 1
                var itemQuantity = itemDetals[1].quantity; // количество 7 сколько было
                var itemQuantityRemaining = itemDetals[1].quantity_remaining; // количество 5 сколько стало
    
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
                let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
                orderListArr[itemDetals[0]][1].item_id = item_id;
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
                let priceHistory = await getItemHistory(appId, fixedEncodeURIComponent(hashName), selectLang);
                InterVal(priceJSON, +buyOrderId, orderPrice, coefficient, item_id, itemQuantity, quantity, priceHistory);
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
        }
    }
}

function InterVal(priceJSON, buyOrderId, MyBuyOrderPrice, coefficient = 0.35, item_id, itemQuantity, quantity, priceHistory) {
    let currentOrder = document.querySelector(' [id ="mybuyorder_' + buyOrderId + '"]');
    let actualProfit = "Nan";
    let myProfit = "Nan";
    let coefPrice = "Nan";
    let MycoefPrice = "Nan";
    let realPrice = "Nan";
    let higestBuyOrder = 0;
    let lowestSellOrder = 0;
    let myNextPrice = 0;

    if (priceJSON.lowest_sell_order !== null && priceJSON.highest_buy_order !== null) {
        higestBuyOrder = (priceJSON.highest_buy_order/100).toFixed(2);
        lowestSellOrder = (priceJSON.lowest_sell_order/100).toFixed(2);
        realPrice = getNumber(freePrice(lowestSellOrder));
        actualProfit = (realPrice - higestBuyOrder).toFixed(2);
        myProfit = (realPrice - MyBuyOrderPrice).toFixed(2);
        coefPrice = (higestBuyOrder * coefficient).toFixed(2);
        MycoefPrice = (MyBuyOrderPrice * coefficient).toFixed(2);
    }
    
    if(priceJSON.highest_buy_order !== null){
        myNextPrice =  NextPrice(priceJSON.highest_buy_order, "higest");
        myRealPrice =  NextPrice(priceJSON.highest_buy_order, "real");
    }

    /*   let realPriceString = `${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPrice}`;
    let actualProfitString = `${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}`;
    let coefPriceString = `${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")} ${coefPrice}`;
    let myProfitString = `${chrome.i18n.getMessage("myProfitDescription")} ${myProfit}`;
    let MycoefPriceString = `${chrome.i18n.getMessage("myCoefficientPriceDescription")} ${MycoefPrice}`; */
   /*  console.log(priceJSON); */

   
    //цены
    let myListingPriceDom = currentOrder.getElementsByClassName('market_listing_price')[0]; // моя цена на покупку, наивысшая цена на покупку, цена на продажу
    DomRemove(myListingPriceDom.parentElement.getElementsByClassName("market_listing_my_order_set")[0]);
    let myListingPriceHTML =`
    <span class="market_listing_my_order_set">
        <br> <span class="market_listing_highest_buy_order">
            ${priceJSON.price_prefix}${higestBuyOrder}${priceJSON.price_suffix}
        </span>
        <br> <span class="market_listing_lowest_sell_order">
            ${priceJSON.price_prefix}${lowestSellOrder}${priceJSON.price_suffix}
            (${priceJSON.price_prefix}${realPrice}${priceJSON.price_suffix})
        </span>
    </span>`;
    myListingPriceDom.insertAdjacentHTML('afterend', DOMPurify.sanitize(myListingPriceHTML));

    //количество заказов
    let myListingQualityDom = currentOrder.getElementsByClassName('market_listing_price')[1];
    DomRemove(myListingQualityDom.parentElement.getElementsByClassName("item_quantity_my_buy_order")[0]);
    let myListingQualityHTML =`
    <span class="item_quantity_my_buy_order">
        <br> 
        <span class="market_listing_highest_buy_order">(${itemQuantity})</span>
    </span>`;
    myListingQualityDom.insertAdjacentHTML('afterend', DOMPurify.sanitize(myListingQualityHTML));

    //продажи 
    let myListingSellsDom = currentOrder.getElementsByClassName('market_my_listing_sells')[0];
    DomRemove(myListingSellsDom.getElementsByClassName("market_listing_highest_count_sells")[0]);
    let myListingSellsHTML =`
    <span class="market_table_value market_listing_highest_count_sells">
        <span class="market_listing_highest_count_sells_1d">${priceHistory.countSell}</span>
        <br> 
        <span class="market_listing_highest_count_sells_7d">${priceHistory.countSellSevenDays}</span>
    </span>
    `;
    myListingSellsDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingSellsHTML));

    //прибыль
    //!!добавить удаление dom
    let myListingPofityDom = currentOrder.getElementsByClassName('market_my_listing_pofit')[0];
    DomRemove(myListingPofityDom.getElementsByClassName("market_listing_table_my_profit")[0]);
    let myListingPofityHTML = `
    <span class="market_table_value market_listing_table_my_profit">
        <span class="market_listing_my_profit">
        ${priceJSON.price_prefix}${myProfit}${priceJSON.price_suffix}
        (${priceJSON.price_prefix}${MycoefPrice}${priceJSON.price_suffix})
        </span>
        <br>
        <span class="market_listing_actual_profit">
        ${priceJSON.price_prefix}${actualProfit}${priceJSON.price_suffix}
        (${priceJSON.price_prefix}${coefPrice}${priceJSON.price_suffix})
        </span>
    </span>`;
    myListingPofityDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingPofityHTML));

    //
    let myListingSellTabDom = currentOrder.getElementsByClassName('market_my_listing_sell_tab')[0];
    DomRemove(myListingSellTabDom.getElementsByClassName("market_table_price_json_sell")[0]);
    let myListingSellTabHTML = `<span class="market_table_value market_table_price_json_sell">${priceJSON.sell_order_table}</span>`;
    myListingSellTabDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingSellTabHTML));

    //таблица покупок
    let myListingBuyTabDom = currentOrder.getElementsByClassName('market_my_listing_buy_tab')[0];
    DomRemove(myListingBuyTabDom.getElementsByClassName("market_table_price_json_buy")[0]);
    let myListingBuyTabHTML = `<span class="market_table_value market_table_price_json_buy">${priceJSON.buy_order_table}</span>`;
    myListingBuyTabDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyTabHTML));

    //market_my_listing_update
    let myListingBuyUpdateDom = currentOrder.getElementsByClassName('market_my_listing_update')[0];
    DomRemove(myListingBuyUpdateDom.getElementsByClassName("change_price_block")[0]);
    let myListingBuyUpdateHTML = `
    <span class="market_table_value change_price_block">
            <input type="number" step="0.01" id="myItemPrice${item_id}" class="create_buy_input">
            <input type="number" id="myItemQuality${item_id}" class="create_buy_input">
            <button id="cancelBuyOrder_${item_id}" class = "button_orders"> ⦸ </button>
            <button id="createBuyOrder_${item_id}" class = "button_orders"> ⨭ </button>
        <div id="responceServerRequest_${item_id}"></div>
    </span>`;
    myListingBuyUpdateDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyUpdateHTML));
    let buttonCancelBuy = document.getElementById(`cancelBuyOrder_${item_id}`);
    let buttonCreateBuy = document.getElementById(`createBuyOrder_${item_id}`);
    let myItemPrice = document.getElementById(`myItemPrice${item_id}`);
    let myItemQuality = document.getElementById(`myItemQuality${item_id}`);
    myItemPrice.value = myNextPrice.myNextPrice;
    myItemQuality.value = quantity;
    buttonCancelBuy.onclick = cancelBuyOrder;
    buttonCreateBuy.onclick = createBuyOrder;
    currentOrder.style.cssText = `background-color: ${Color(priceJSON.highest_buy_order/100, MyBuyOrderPrice, actualProfit, myProfit, coefPrice, MycoefPrice)}`;
}

let DomRemove = (Dom) => {if(Dom !== undefined) Dom.remove()};

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

async function cancelBuyOrder() {
    let item_id = this.id.split('_')[1];
    let itemInfo = orderListArr.filter(item => item[1].item_id === item_id)[0];
    if (itemInfo.length === 2) {
        let orderId = itemInfo[1].buy_orderid;
        if(orderId !==null && sessionId !==null) {
            let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
            let url = "https://steamcommunity.com/market/cancelbuyorder/";
            let serverResponse = await globalThis.httpPostErrorPause(url, params);
            let htmlResponce = document.getElementById(`responceServerRequest_${item_id}`);
            htmlResponce.textContent = (serverResponse.success === 1) ?  "Done cancel" : "Error cancel"; /* {success: 1} */
        }   
    }
}

async function createBuyOrder() {

    let item_id = this.id.split('_')[1];
    let itemInfo = orderListArr.filter(item => item[1].item_id === item_id)[0];
    if (itemInfo.length === 2) {
        let appid = itemInfo[1].appid;
        let hashname = itemInfo[1].hash_name;
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
            let serverResponse = await globalThis.httpPostErrorPause(url, params);
            let htmlResponce = document.getElementById(`responceServerRequest_${item_id}`);
            if (serverResponse.success === 1) {
                htmlResponce.textContent = "Price updated";  
                orderListArr[itemInfo[0]][1].buy_orderid = serverResponse.buy_orderid;
                console.log(this.parentElement.parentElement.parentElement);
                let steamItemBlock = this.parentElement.parentElement.parentElement;
                //<div class="market_listing_row market_recent_listing_row" id="mybuyorder_4157921926" style="background-color: rgb(96, 55, 62);"></div>
                steamItemBlock.getElementsByClassName("market_listing_price")[0].innerText = NextPrice((inputPrice*100).toFixed(), "real").myNextPrice;
                steamItemBlock.getElementsByClassName('market_listing_price')[1].innerText = itemCount;
                await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + extensionSetings.selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
                let priceHistory = await getItemHistory(appid, hashname, extensionSetings.selectLang);
                let buyOrderId = steamItemBlock.id.split('_')[1]; // 4078635920
                InterVal(priceJSON, +buyOrderId, NextPrice((inputPrice*100).toFixed(), "real").myNextPrice, extensionSetings.coefficient, item_id, itemCount, itemCount, priceHistory);
            }
            htmlResponce.textContent = (serverResponse.success === 29) ? serverResponse.message : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
        }
    }
}

