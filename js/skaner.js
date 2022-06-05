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
let orderListBuyArr;
let orderListSaleArr;
let buyOrderHeader = document.getElementsByClassName("market_listing_table_header")[1];
let listingsOrderHeader = document.getElementsByClassName("market_listing_table_header")[0];
//buyHeadersNames массив элементов
let buyHeadersNames = ["Sells", "Pofit", "Buy_tab", "Sell_tab", "Update",];
let listingsHeadersNames = ["Buy_tab", "Sell_tab", "Update",];
HeadersNames(buyHeadersNames, buyOrderHeader);
HeadersNames(listingsHeadersNames, listingsOrderHeader);
function HeadersNames(HeadersNames, orderHeader) {
    for (const key in HeadersNames) {
        var createHeader = document.createElement("span");
        createHeader.className = `market_listing_right_cell market_listing_my_price market_my_listing_${HeadersNames[key].toLowerCase()}`;
        createHeader.innerText = HeadersNames[key];
        orderHeader.append(createHeader);
    }
}

chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
    "quantity",
    "runBuyOrders",
    "runSaleOrders",
    "quantityItemsInHistory",

], function (data) {
    
    sessionId = SessionIdVal();
    console.log(sessionId);
    
        extensionSetings = {
            "coefficient": data.coefficient,
            "selectLang": data.selectLang,
            "CountRequesrs": 5,
            "scanIntervalSET": data.scanIntervalSET,
            "errorPauseSET": data.errorPauseSET,
            "quantity": data.quantity,
        };
        /* startScan("buy_orders", "mybuyorder_", data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET, data.quantity); */
        RunSan(data.runBuyOrders, data.runSaleOrders, extensionSetings);
        showHistory(data.quantityItemsInHistory);

});

async function RunSan (runBuyOrders, runSaleOrders, extensionSetings) {
    let {coefficient,
        selectLang,
        CountRequesrs,
        scanIntervalSET,
        errorPauseSET,
        quantity } = extensionSetings;

    if (runBuyOrders) {
        await ordersScan(
            {
                orderTupe: "buy_orders", // какие данные достать в Json 
                partIdName: "mybuyorder_", // фрагмент id который должен содержать блок
                PastBeforeName: "market_listing_buyorder_qty", // вставить блоки <div> после имени в функции createHtmlBlock()
            },
            coefficient,
            selectLang,
            CountRequesrs,
            scanIntervalSET,
            errorPauseSET,
            quantity
        );
    }

    if (runSaleOrders) {
        await ordersScan(
            {
                orderTupe: "listings", // какие данные достать в Json 
                partIdName: "mylisting_", // фрагмент id который должен содержать блок
                PastBeforeName: "market_listing_listed_date",
            },
            coefficient,
            selectLang,
            CountRequesrs,
            scanIntervalSET,
            errorPauseSET,
            quantity
        );
    }

}

/**
 * 
 * Основной скрипт для сканирования
 * 
 * @param {Object} blockValues  //какие данные достать в Json , фрагмент id который должен содержать блок, вставить блоки <div> после имени в функции createHtmlBlock()
 * @param {Float} coefficient  коэфицент для вычисления цены
 * @param {string} selectLang язык который будет использоваться для запроса запроса 
 * @param {number} CountRequesrs количество повторений в запросе
 * @param {number} scanIntervalSET пауза между запросами
 * @param {number} errorPauseSET пауза между ошибками
 * @returns 
 */

async function ordersScan(blockValues, coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000, quantityWant = 1) {
    
    let DuplicateItemsArr =[];

    let ObjectOrderInfo = await myPriceLink(selectLang, blockValues, CountRequesrs, scanIntervalSET, errorPauseSET);
    let arrMyPriceLink = ObjectOrderInfo.arrMyPriceLink;
    orderListArr = ObjectOrderInfo.orderListArr;

    if (orderListArr.length > 0 && orderListArr.length === arrMyPriceLink.length) {
        for (let orderKey = 0; orderKey < orderListArr.length; orderKey++) {
            let [orderPrice, orderHref, orderId] = arrMyPriceLink[orderKey];

            let boolVal = true;
            let IdArrDuplicateItemsInfo;
            DuplicateItemsArr.map(item => item.includes(orderHref) ? boolVal = false : boolVal = true);

            if (blockValues.orderTupe === "buy_orders") {
                
                itemDetals = orderListArr.filter(item => item[1].buy_orderid === orderId)[0]; //1 ключ 2 содержимое

                if (itemDetals.length === 2) {
                    //appid = 753 (id game) //buy_orderid (id заказа) //hash_name = "489630-Lord Commissar (Foil Trading Card)"
                    //wallet_currency = 1 //quantity = 7 (сколько было) //quantity_remaining = 5 (сколько стало)
                    let { appid, buy_orderid, hash_name, wallet_currency, quantity, quantity_remaining } = itemDetals[1];
                    let { priceJSON, priceHistory, item_id } = await itemIdpriceJSONpriceHistory(itemDetals, appid, orderHref, selectLang, hash_name, CountRequesrs, scanIntervalSET, errorPauseSET);

                    await InterVal(priceJSON, buy_orderid, orderPrice, coefficient, item_id, quantity, quantityWant, priceHistory);
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                }

            } else if (boolVal && blockValues.orderTupe === "listings") {
                IdArrDuplicateItemsInfo = Object.entries(arrMyPriceLink).filter(item => item[1][1] === orderHref);
                DuplicateItemsArr.push(orderHref);
                orderId = IdArrDuplicateItemsInfo[0][1][2];
                itemDetals = orderListArr.filter(item => item[1].listingid === orderId)[0]; //1 ключ 2 содержимое

                if (itemDetals.length === 2) {
                    let { appid, market_hash_name } = itemDetals[1].asset;
                    let hash_name = market_hash_name;
                    let { listingid } = itemDetals[1];
                    let { priceJSON, priceHistory, item_id } = await itemIdpriceJSONpriceHistory(itemDetals, appid, orderHref, selectLang, hash_name, CountRequesrs, scanIntervalSET, errorPauseSET);

                    //массив listingid
                    let listingidArr = [];
                    IdArrDuplicateItemsInfo.map(itemInfo => listingidArr.push(itemInfo[1][2]));
                    await listingsTreatment(priceJSON, listingidArr, orderPrice, coefficient);
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                }
                /* 1: Array(3) IdArrDuplicateItemsInfo
                0: (2) ['0.46', '0.40']
                1: "https://steamcommunity.com/market/listings/753/958400-Porsche%20935%20%28Foil%20Trading%20Card%29"
                2: "5539996196114360768" */
            }
        }
    }
}

async function itemIdpriceJSONpriceHistory (itemDetals, appid, orderHref, selectLang, hash_name, CountRequesrs, scanIntervalSET, errorPauseSET) {
    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
    let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
    let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
    orderListArr[itemDetals[0]][1].item_id = item_id;

    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
    let priceHistory = await getItemHistory(appid, fixedEncodeURIComponent(hash_name), selectLang);
    return {priceJSON, priceHistory, item_id};
}

async function myPriceLink(selectLang, blockValues, CountRequesrs, scanIntervalSET, errorPauseSET) {
    var arrMyPriceLink = [];
    let blockNames;
    let orderListArr = [];
    let myListings = JSON.parse(await globalThis.httpErrorPause("https://steamcommunity.com/market/mylistings/?norender=1", CountRequesrs, scanIntervalSET, errorPauseSET));

    let marketItems = document.getElementsByClassName("market_listing_row market_recent_listing_row");
    if (blockValues.orderTupe === "buy_orders") {
        let orderListJson = myListings[blockValues.orderTupe];
        blockNames = buyHeadersNames.reverse();
        orderListArr = Object.entries(orderListJson); // массив значений товаров
        orderListBuyArr = orderListArr; //чобы работали кнопки отменить разместить заказ иначе они обуляются при вызове
    }
    if (blockValues.orderTupe === "listings") {
        blockNames = listingsHeadersNames.reverse();
        orderListArr = await loadAllListings(myListings.num_active_listings, 100, CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000);
        orderListSaleArr = orderListArr; //чобы работали кнопки отменить разместить заказ иначе они обуляются при вызове

        let listing = document.getElementById("tabContentsMyActiveMarketListingsTable");
        sortMarketListings(listing, true, false, false);
    }

    for (let marketItem of marketItems) {
        if (marketItem.id.includes(blockValues.partIdName) && window.getComputedStyle(marketItem).display === "block") {

            createHtmlBlock(blockNames, marketItem, blockValues.PastBeforeName);
            let orderlink = marketItem.getElementsByClassName('market_listing_item_name_link')[0].href;
            let orderprice = marketItem.getElementsByClassName('market_listing_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
            let orderId = marketItem.id.split('_')[1]; // 4078635920
            arrMyPriceLink.push([orderprice, orderlink, orderId]);
        }
    }
    return { arrMyPriceLink, orderListArr };
}




async function loadAllListings(num_active_listings, step, CountRequesrs, scanIntervalSET, errorPauseSET) {
    let countLoadslistings = Math.ceil(num_active_listings / step);

    let tabListing = document.getElementById('tabContentsMyActiveMarketListingsRows');
    document.getElementsByClassName("market_pagesize_options")[0].style.display = "none";
    document.getElementById("tabContentsMyActiveMarketListings_ctn").style.display = "none";
    tabListing.innerText = "";
    let arrListJson = [];
    for (let start = 0; start < countLoadslistings; start++) {
        let startVal = start * step;
        let countVal = startVal + step;
        await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
        let listJSONhtml = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/mylistings/render/?query=&start=${startVal}&count=${step}`, CountRequesrs, scanIntervalSET, errorPauseSET));
        await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
        tabListing.insertAdjacentHTML('beforeend', DOMPurify.sanitize(listJSONhtml.results_html));
        let listJSON = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/mylistings/render/?query=&start=${startVal}&count=${step}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));

        arrListJson = [...arrListJson, ...listJSON.listings].filter(Object);
    }
    return Object.entries(arrListJson);
}




function createHtmlBlock(blockNamesArr, marketItem, PastBeforeName) {
    for (const key in blockNamesArr) {
        countBlock = marketItem.getElementsByClassName(PastBeforeName)[0];
        let myItemBlocksHTML = `<div class="market_listing_right_cell market_listing_my_price market_my_listing_${blockNamesArr[key].toLowerCase()}"></div>`;
        let cleanMyItemBlocksHTML = DOMPurify.sanitize(myItemBlocksHTML);
        countBlock.insertAdjacentHTML('afterend', cleanMyItemBlocksHTML);
    }
}

let DomRemove = (Dom) => { if (Dom !== undefined) Dom.remove() };

async function listingsTreatment(priceJSON, listingidArr, MySaleOrderPrice, coefficient = 0.35) {
    for (let index = 0; index < listingidArr.length; index++) {
        const listingid = listingidArr[index];
        let currentOrder = document.querySelector(' [id ="mylisting_' + listingid + '"]');

        let {
            actualProfit,
            myProfit,
            coefPrice,
            MycoefPrice,
            realPriceLowestSellOrder,
            higestBuyOrder,
            lowestSellOrder,
            myNextSellPrice,
            myRealSellPrice,
        } = orderCalculation(priceJSON, MySaleOrderPrice, coefficient);
        let myListingSellTabDom = currentOrder.getElementsByClassName('market_my_listing_sell_tab')[0];
        DomRemove(myListingSellTabDom.getElementsByClassName("market_table_price_json_sell")[0]);
        itemSellTab(priceJSON, myListingSellTabDom);
    
        //таблица покупок
        let myListingBuyTabDom = currentOrder.getElementsByClassName('market_my_listing_buy_tab')[0];
        DomRemove(myListingBuyTabDom.getElementsByClassName("market_table_price_json_buy")[0]);
        itemBuyTab(priceJSON, myListingBuyTabDom);
    
        let myListingPriceDom = currentOrder.getElementsByClassName('market_listing_price')[0]; // моя цена на покупку, наивысшая цена на покупку, цена на продажу
        DomRemove(myListingPriceDom.parentElement.getElementsByClassName("market_listing_lowest_sell_order")[0]);
        lowestSellOrderVal(priceJSON, lowestSellOrder, realPriceLowestSellOrder, myListingPriceDom);

    
         //market_my_listing_update
        let myListingBuyUpdateDom = currentOrder.getElementsByClassName('market_my_listing_update')[0];
        DomRemove(myListingBuyUpdateDom.getElementsByClassName("change_price_block")[0]);
        let item_id = listingid.split("mylisting_");
        itemOrderChangeSale(item_id, myListingBuyUpdateDom, myRealSellPrice);


        currentOrder.style.cssText = `background-color: ${colorSale(priceJSON.lowest_sell_order / 100, MySaleOrderPrice)}`;
    }
}



async function InterVal(priceJSON, buyOrderId, MyBuyOrderPrice, coefficient = 0.35, item_id, itemQuantity, quantityWant, priceHistory) {
    let currentOrder = document.querySelector(' [id ="mybuyorder_' + buyOrderId + '"]');
    let {
        actualProfit,
        myProfit,
        coefPrice,
        MycoefPrice,
        realPriceLowestSellOrder,
        higestBuyOrder,
        lowestSellOrder,
        myNextBuyPrice
    } = orderCalculation(priceJSON, MyBuyOrderPrice, coefficient);

    /*   let realPriceString = `${chrome.i18n.getMessage("priceWithoutCommissionDescription")} ${realPriceLowestSellOrder}`;
    let actualProfitString = `${chrome.i18n.getMessage("profitAtTheMomentDescription")} ${actualProfit}`;
    let coefPriceString = `${chrome.i18n.getMessage("coefficientPriceAtTheMomentDescription")} ${coefPrice}`;
    let myProfitString = `${chrome.i18n.getMessage("myProfitDescription")} ${myProfit}`;
    let MycoefPriceString = `${chrome.i18n.getMessage("myCoefficientPriceDescription")} ${MycoefPrice}`; */


    //цены
    let myListingPriceDom = currentOrder.getElementsByClassName('market_listing_price')[0]; // моя цена на покупку, наивысшая цена на покупку, цена на продажу
    DomRemove(myListingPriceDom.parentElement.getElementsByClassName("market_listing_lowest_sell_order")[0]);
    lowestSellOrderVal(priceJSON, lowestSellOrder, realPriceLowestSellOrder, myListingPriceDom);
    DomRemove(myListingPriceDom.parentElement.getElementsByClassName("market_listing_my_buy_set")[0]);
    highestBuyOrderVal(priceJSON, higestBuyOrder, myListingPriceDom);
    //количество заказов
    let myListingQualityDom = currentOrder.getElementsByClassName('market_listing_price')[1];
    DomRemove(myListingQualityDom.parentElement.getElementsByClassName("item_quantity_my_buy_order")[0]);
    highestBuyOrderCount(itemQuantity, myListingQualityDom);

    //продажи 
    let myListingSellsDom = currentOrder.getElementsByClassName('market_my_listing_sells')[0];
    DomRemove(myListingSellsDom.getElementsByClassName("market_listing_highest_count_sells")[0]);
    itemCountSells(priceHistory, myListingSellsDom);

    //прибыль
    //!!добавить удаление dom
    let myListingPofityDom = currentOrder.getElementsByClassName('market_my_listing_pofit')[0];
    DomRemove(myListingPofityDom.getElementsByClassName("market_listing_table_my_profit")[0]);
    itemProfit(priceJSON, myProfit, MycoefPrice, actualProfit, coefPrice, myListingPofityDom);

    //
    let myListingSellTabDom = currentOrder.getElementsByClassName('market_my_listing_sell_tab')[0];
    DomRemove(myListingSellTabDom.getElementsByClassName("market_table_price_json_sell")[0]);
    itemSellTab(priceJSON, myListingSellTabDom);

    //таблица покупок
    let myListingBuyTabDom = currentOrder.getElementsByClassName('market_my_listing_buy_tab')[0];
    DomRemove(myListingBuyTabDom.getElementsByClassName("market_table_price_json_buy")[0]);
    itemBuyTab(priceJSON, myListingBuyTabDom);

    //market_my_listing_update
    let myListingBuyUpdateDom = currentOrder.getElementsByClassName('market_my_listing_update')[0];
    DomRemove(myListingBuyUpdateDom.getElementsByClassName("change_price_block")[0]);
    itemOrderChange(item_id, myListingBuyUpdateDom, myNextBuyPrice, quantityWant);
    currentOrder.style.cssText = `background-color: ${Color(priceJSON.highest_buy_order / 100, MyBuyOrderPrice, actualProfit, myProfit, coefPrice, MycoefPrice)}`;
}

function orderCalculation(priceJSON, MyBuyOrderPrice, coefficient) {
    let actualProfit = "Nan";
    let myProfit = "Nan";
    let coefPrice = "Nan";
    let MycoefPrice = "Nan";
    let realPriceLowestSellOrder = "Nan";
    let higestBuyOrder = 0;
    let lowestSellOrder = 0;
    let myNextBuyPrice = 0;
    let myRealBuyPrice = 0;
    let myNextSellPrice = 0;
    let myRealSellPrice = 0;

    if (priceJSON.lowest_sell_order !== null) {
        lowestSellOrder = (priceJSON.lowest_sell_order / 100).toFixed(2);
        realPriceLowestSellOrder = getNumber(freePrice(lowestSellOrder));

        myNextSellPrice = NextPrice(priceJSON.lowest_sell_order, "higest");
        myRealSellPrice = NextPrice(priceJSON.lowest_sell_order, "real");
    }

    if (priceJSON.lowest_sell_order !== null && priceJSON.highest_buy_order !== null) {
        higestBuyOrder = (priceJSON.highest_buy_order / 100).toFixed(2);
        actualProfit = (realPriceLowestSellOrder - higestBuyOrder).toFixed(2);
        myProfit = (realPriceLowestSellOrder - MyBuyOrderPrice).toFixed(2);
        coefPrice = (higestBuyOrder * coefficient).toFixed(2);
        MycoefPrice = (MyBuyOrderPrice * coefficient).toFixed(2);
        myNextBuyPrice = NextPrice(priceJSON.highest_buy_order, "higest");
        myRealBuyPrice = NextPrice(priceJSON.highest_buy_order, "real");
    }
    return { actualProfit, myProfit, coefPrice, MycoefPrice, realPriceLowestSellOrder, higestBuyOrder, lowestSellOrder, myNextBuyPrice, myRealBuyPrice, myNextSellPrice, myRealSellPrice};

}

function highestBuyOrderVal(priceJSON, higestBuyOrder, listingPriceDom) {
    let listingPriceHTML = `
    <span class="market_listing_my_buy_set">
        <br> <span class="market_listing_highest_buy_order">
            ${priceJSON.price_prefix}${higestBuyOrder}${priceJSON.price_suffix}
        </span>
    </span>`;
    listingPriceDom.insertAdjacentHTML('afterend', DOMPurify.sanitize(listingPriceHTML));
}

function lowestSellOrderVal(priceJSON, lowestSellOrder, realPriceLowestSellOrder, listingPriceDom) {
    let listingPriceHTML = `
    <span class="market_listing_my_sell_set">
        <br> <span class="market_listing_lowest_sell_order">
            ${priceJSON.price_prefix}${lowestSellOrder}${priceJSON.price_suffix}
            (${priceJSON.price_prefix}${realPriceLowestSellOrder}${priceJSON.price_suffix})
        </span>
    </span>`;
    listingPriceDom.insertAdjacentHTML('afterend', DOMPurify.sanitize(listingPriceHTML));
}

function highestBuyOrderCount(itemQuantity, listingQualityDom) {
    let listingQualityHTML = `
    <span class="item_quantity_my_buy_order">
        <br> 
        <span class="market_listing_highest_buy_order">(${itemQuantity})</span>
    </span>`;
    listingQualityDom.insertAdjacentHTML('afterend', DOMPurify.sanitize(listingQualityHTML));
}


function itemCountSells(priceHistory, listingSellsDom) {
    let listingSellsHTML = `
    <span class="market_table_value market_listing_highest_count_sells">
        <span class="market_listing_highest_count_sells_1d">${priceHistory.countSell}</span>
        <br> 
        <span class="market_listing_highest_count_sells_7d">${priceHistory.countSellSevenDays}</span>
    </span>
    `;
    listingSellsDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(listingSellsHTML));
}

function itemProfit(priceJSON, myProfit, MycoefPrice, actualProfit, coefPrice, listingPofityDom) {
    let listingPofityHTML = `
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
    listingPofityDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(listingPofityHTML));
}

function itemSellTab(priceJSON, listingSellTabDom) {
    let listingSellTabHTML = `<span class="market_table_value market_table_price_json_sell">${priceJSON.sell_order_table}</span>`;
    listingSellTabDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(listingSellTabHTML));
}

function itemBuyTab(priceJSON, listingBuyTabDom) {

    let listingBuyTabHTML = `<span class="market_table_value market_table_price_json_buy">${priceJSON.buy_order_table}</span>`;
    listingBuyTabDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(listingBuyTabHTML));
}

function itemOrderChange(item_id, myListingBuyUpdateDom, myNextBuyPrice, quantityWant) {

    let myListingBuyUpdateHTML = `
    <span class="market_table_value change_price_block">
        <span id="myItemRealBuyPrice${item_id}">${myNextBuyPrice.nextPriceWithoutFee}</span>
        <br>
        <span id="myItemNextBuyPrice${item_id}">${myNextBuyPrice.myNextPrice}</span>
        <br>
        <input type="number" step="0.01" id="myItemBuyPrice${item_id}" class="create_buy_input">
        <input type="number" id="myItemQuality${item_id}" class="create_buy_input">
        <button id="cancelBuyOrder_${item_id}" class = "button_orders"> ⦸ </button>
        <button id="createBuyOrder_${item_id}" class = "button_orders"> ⨭ </button>
        <div id="responceServerRequestBuyOrder_${item_id}"></div>
    </span>`;
    myListingBuyUpdateDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyUpdateHTML));
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
    buttonCancelBuy.onclick = cancelBuyOrder;
    buttonCreateBuy.onclick = createBuyOrder;
}

function itemOrderChangeSale(item_id, myListingSaleUpdateDom, myRealSellPrice) {
    let lessСenter = (myRealSellPrice.myNextPrice - 0.01).toFixed(2);
    let moreEstimated = (lessСenter > 0.03) ? lessСenter : 0.03;
    let LowestSalePrice =NextPrice((moreEstimated * 100).toFixed(), "real");
    
    let myListingBuyUpdateHTML = `
    <span class="market_table_value change_price_block">
            <span id="myItemRealSalePrice${item_id}">${myRealSellPrice.nextPriceWithoutFee}</span>
            <br>
            <span id="myItemNextSalePrice${item_id}">${LowestSalePrice.myNextPrice}</span>
            <br>
            <input type="number" step="0.01" id="myItemSalePrice${item_id}" class="create_buy_input">
            <button id="cancelBuyOrderForSale_${item_id}" class = "button_orders"> ⦸ </button>
            <button id="createBuyOrderForSale_${item_id}" class = "button_orders"> ↻ </button>
        <div id="responceServerRequestBuyOrderSale_${item_id}"></div>
    </span>`;
    myListingSaleUpdateDom.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyUpdateHTML));
    let buttonCancelSale = document.getElementById(`cancelBuyOrderForSale_${item_id}`);
    let buttonCreateSale = document.getElementById(`createBuyOrderForSale_${item_id}`);
    let myItemSalePrice = document.getElementById(`myItemSalePrice${item_id}`);
    let myItemRealSalePrice = document.getElementById(`myItemRealSalePrice${item_id}`);
    let myItemNextSalePrice = document.getElementById(`myItemNextSalePrice${item_id}`);
    myItemSalePrice.value = LowestSalePrice.myNextPrice;
    myItemSalePrice.onchange = () => {
        myItemRealSalePrice.textContent = myItemSalePrice.value ? NextPrice((myItemSalePrice.value * 100).toFixed(), "real").nextPriceWithoutFee : '';
        myItemNextSalePrice.textContent = myItemSalePrice.value ? NextPrice((myItemSalePrice.value * 100).toFixed(), "real").myNextPrice : '';
    };
    buttonCancelSale.onclick = cancelBuyOrderSale;
    buttonCreateSale.onclick = reloadBuyOrderSale;
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

function colorSale(JSONsale_order, MySaleOrderPrice) {

    if (JSONsale_order.length != 0) {
        if (MySaleOrderPrice == "Nan") {
            return '#000732;'; //blue неизвестно
        }
        if (JSONsale_order == MySaleOrderPrice[0]) {
            return '#1c563d;'; //green всё хорошо
        } else {
            return '#60373e;'; //red необходимо поменять
        }
    } return '#000732;';
}

async function cancelBuyOrder() {
    let item_id = this.id.split('_')[1];
    let itemInfo = orderListBuyArr.filter(item => item[1].item_id === item_id)[0];
    if (itemInfo.length === 2) {
        let orderId = itemInfo[1].buy_orderid;
        if (orderId !== null && sessionId !== null) {
            let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
            let url = "https://steamcommunity.com/market/cancelbuyorder/";
            let serverResponse = await globalThis.httpPostErrorPause(url, params);
            let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
            htmlResponce.textContent = (serverResponse.success === 1) ? "Done cancel" : "Error cancel"; /* {success: 1} */
        }
    }
}

async function cancelBuyOrderSale() {
    let listingid = this.id.split('_')[1];
    let itemInfo = orderListSaleArr.filter(item => item[1].listingid === listingid)[0];
    console.log(itemInfo);
    if (itemInfo.length === 2) {
        let serverResponseCancelBuyOrder = await cancelBuyOrderSaleRequest (sessionId, listingid);
        let htmlResponce = document.getElementById(`responceServerRequestBuyOrderSale_${listingid}`);
        htmlResponce.textContent = (serverResponseCancelBuyOrder.success === 1) ? "Done cancel" : "Error cancel"; 
    }
    await new Promise(done => timer = setTimeout(() => done(), + 2000 + Math.floor(Math.random() * 500)));
    document.getElementById(`mylisting_${listingid}`).remove();
}

async function cancelBuyOrderSaleRequest (sessionId, listingid) { 
    if (sessionId !== null && listingid !== null) {
        let url = `https://steamcommunity.com/market/removelisting/${listingid}`;
        let params = `sessionid=${sessionId}`;
        return await globalThis.httpPostErrorPause(url, params);
    }
}

/* https://steamcommunity.com/market/removelisting/3347823316609638798 */

async function createBuyOrder() {

    let item_id = this.id.split('_')[1];
    let itemInfo = orderListBuyArr.filter(item => item[1].item_id == item_id)[0];
    if (itemInfo.length === 2) {
        let { appid, hash_name } = itemInfo[1];
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
        if (appid !== null && hash_name !== null && item_id !== null) {
            let params = `sessionid=${sessionId}&currency=1&appid=${appid}&market_hash_name=${hash_name}&price_total=${Math.round(inputPrice * 100 * itemCount)}&quantity=${itemCount}&billing_state=&save_my_address=0`;
            let url = "https://steamcommunity.com/market/createbuyorder/";
            let serverResponse = await globalThis.httpPostErrorPause(url, params);
            let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
            if (serverResponse.success === 1) {
                htmlResponce.textContent = "Price updated";
                orderListBuyArr[itemInfo[0]][1].buy_orderid = serverResponse.buy_orderid;
                
                let steamItemBlock = this.parentElement.parentElement.parentElement;
                //<div class="market_listing_row market_recent_listing_row" id="mybuyorder_4157921926" style="background-color: rgb(96, 55, 62);"></div>
                steamItemBlock.getElementsByClassName("market_listing_price")[0].innerText = NextPrice((inputPrice * 100).toFixed(), "real").myNextBuyPrice;
                steamItemBlock.getElementsByClassName('market_listing_price')[1].innerText = itemCount;
                await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + extensionSetings.selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
                let priceHistory = await getItemHistory(appid, hash_name, extensionSetings.selectLang);
                let buyOrderId = steamItemBlock.id.split('_')[1]; // 4078635920
                InterVal(priceJSON, buyOrderId, NextPrice((inputPrice * 100).toFixed(), "real").myNextBuyPrice, extensionSetings.coefficient, item_id, itemCount, itemCount, priceHistory);
            }
            htmlResponce.textContent = (serverResponse.success === 29) ? serverResponse.message : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
        }
    }
}


async function reloadBuyOrderSale() {
    let listingid = this.id.split('_')[1];
    let buyOrderInput = document.getElementById(`myItemSalePrice${listingid}`);
    let realSalePrice = buyOrderInput.value ? (NextPrice((buyOrderInput.value * 100).toFixed(), "real").nextPriceWithoutFee * 100).toFixed() : 0;
    let itemInfo = orderListSaleArr.filter(item => item[1].listingid === listingid)[0];
    let htmlResponce = document.getElementById(`responceServerRequestBuyOrderSale_${listingid}`);
    if (itemInfo.length === 2 && realSalePrice) {

        let serverResponseCancelBuyOrder = await cancelBuyOrderSaleRequest (sessionId, listingid);
        let htmlResponce = document.getElementById(`responceServerRequestBuyOrderSale_${listingid}`);
        htmlResponce.textContent = (serverResponseCancelBuyOrder.success === 1) ? "Done cancel" : "Error cancel"; 
        let {appid, contextid, classid} = itemInfo[1].asset;
        let UserUrlName = document.getElementsByClassName("user_avatar")[0].href.split("/")[4];
        if (sessionId !== null && appid !== null && contextid !== null&& classid !== null) {
            await new Promise(done => timer = setTimeout(() => done(), + extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            let UserNameXmlString = await globalThis.httpErrorPause(`https://steamcommunity.com/id/${UserUrlName}/?xml=1`, extensionSetings.CountRequesrs, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET);
            await new Promise(done => timer = setTimeout(() => done(), + extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            var parser = new DOMParser();
            var UserNameXml = parser.parseFromString(UserNameXmlString, "application/xml");
            steamID = UserNameXml.getElementsByTagName("steamID64")[0].textContent;
            let arrAssetidJson = await loadAllAssetid(5000, appid, contextid, steamID); 
            let {assetid} = arrAssetidJson.find(itemAsset =>  classid === itemAsset.classid ? itemAsset.assetid : false);
            let params = `sessionid=${sessionId}&appid=${appid}&contextid=${contextid}&assetid=${assetid}&amount=1&price=${realSalePrice}`;
            let url = "https://steamcommunity.com/market/sellitem/";
            
            let serverResponse = await globalThis.httpPostErrorPause(url, params);
            console.log(serverResponse);
            htmlResponce.textContent = (serverResponse.success === true) ? "Price updated" : "Updated Error";
            await new Promise(done => timer = setTimeout(() => done(), + extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            document.getElementById(`mylisting_${listingid}`).remove();
            return; 
        }
    }
    htmlResponce.textContent = "incorrect value"; 

    /**
    чужой инвентарь
    https://steamcommunity.com/inventory/76561198241424096/753/6?la=english&count=5000
     */
}

async function loadAllAssetid (step, appid, contextid, steamID) { 
    let AssetidFirstJSON = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/inventory/${steamID}/${appid}/${contextid}?language=${extensionSetings.selectLang}&count=${step}`, 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
    let lastAsset = AssetidFirstJSON.last_assetid;
    let arrAssetidJson = [];
    arrAssetidJson = [...arrAssetidJson, ...AssetidFirstJSON.assets];
    while (lastAsset !== undefined) {
        await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
        let AssetidJSON = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/inventory/${steamID}/${appid}/${contextid}?language=${extensionSetings.selectLang}&count=${step}&start_assetid=${lastAsset}`, extensionSetings.CountRequesrs, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
        lastAsset = AssetidJSON.last_assetid;
        arrAssetidJson = [...arrAssetidJson, ...AssetidJSON.assets];
    }
    return arrAssetidJson;
}


function sortMarketListings(domElement, name, dataTime, price) {
    if (domElement == null) {
        console.log('Invalid parameter, could not find a list.');
        return;
    }

    const arrowDown = '🡻';
    const arrowUp = '🡹';
    let currentDomArr = domElement.querySelectorAll('.market_listing_table_header > span'); //массив
    Array.prototype.map.call(currentDomArr,
    (currentDom) => {
        let notUseSort =[
        "market_listing_edit_buttons",
        "market_my_listing_update",
        "market_my_listing_sell_tab",
        "market_my_listing_update",
        ];
        let notUseSortBool = false;
        //игнорировать эти классы чтобы сортировка не выполнялась
        notUseSort.map(itemClass => notUseSortBool = currentDom.classList.contains(itemClass)? true : false);
        if (notUseSortBool) return;
        let currentDomHead = domElement.querySelector('.market_listing_table_header');
        
        let nameDomVal= currentDomHead.querySelectorAll('span')[3];
        let dataTimeDomVal= currentDomHead.querySelector('.market_listing_listed_date')
        let priceDomVal= currentDomHead.querySelector('.market_listing_my_price');
        if (name) 
            defaultSort (nameDomVal, "market_listing_item_name_block");

        if (dataTime) 
            defaultSort (dataTimeDomVal, "market_listing_listed_date");

        if (price) 
            defaultSort (priceDomVal, "market_listing_my_price");

        function defaultSort (DomVal, columnClassName) {
            if (!nameDomVal.outerText.includes(arrowUp) && !dataTimeDomVal.outerText.includes(arrowUp) && !priceDomVal.outerText.includes(arrowUp)) {
                DomVal.innerText = `${DomVal.innerText} ${arrowUp}`;
            }
            sortDom(columnClassName, domElement, false);
            return;
        }
        currentDom.onclick = (event) => {

            let eventv = event.target;
            if (eventv.outerText == currentDom.outerText) {

                Array.prototype.map.call(currentDomArr,
                    (currentDomVal) => {
                        if (currentDomVal.classList.value != eventv.classList.value) {
                            currentDomVal.innerText = currentDomVal.innerText.replace(/🡻/gi, "");
                            currentDomVal.innerText = currentDomVal.innerText.replace(/🡹/gi, "");
                        }
                    });
                    let columnName;
                    if (eventv.classList.value === '') {
                        columnName = "market_listing_item_name_block";
                    }
                    let columnNameArr =  eventv.classList.value.split(" ");

                    columnNameArr.map((itemClass) => {
                        if (itemClass.includes("market_listing")) {
                            columnName = itemClass;
                        }
                    });

                if (!eventv.outerText.includes(arrowDown) && !eventv.outerText.includes(arrowUp)) {
                    eventv.innerText = `${eventv.innerText} ${arrowUp}`;
                    sortDom(columnName, domElement, false);
                    return;
                }

                if (eventv.outerText.includes(arrowDown)) {
                    eventv.innerText = eventv.innerText.replace(/🡻/gi, "🡹");
                    sortDom(columnName, domElement, false);
                    return;
                }

                if (eventv.outerText.includes(arrowUp)) {
                    eventv.innerText = eventv.innerText.replace(/🡹/gi, "🡻");
                    sortDom(columnName, domElement, true);
                    return;
                }
            }
        }
    });
}

function sortDom(columnName, domElement, asc) {
    let domTable =domElement.querySelectorAll('#tabContentsMyActiveMarketListingsRows')[0]; 
    let domStringArr = domElement.getElementsByClassName("market_listing_row");
    [...domStringArr]
    .sort((firstDom, secondDom)=>{
        if (asc) {
            return firstDom.getElementsByClassName(columnName)[0].innerText<secondDom.getElementsByClassName(columnName)[0].innerText?1:-1
        }else{
            return firstDom.getElementsByClassName(columnName)[0].innerText>secondDom.getElementsByClassName(columnName)[0].innerText?1:-1
        }
    })
    .map(node=>domTable.appendChild(node));
}