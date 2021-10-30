var g_rgWalletInfo = {
    wallet_fee: 1,
    wallet_fee_base: 0,
    wallet_fee_minimum: 1,
    wallet_fee_percent: 0.05,
    wallet_publisher_fee_percent_default: 0.10,
    wallet_currency: 1
};
let coefficient;
let selectLang;
let CountRequesrs;
let scanIntervalSET;
let errorPauseSET;
let sizePage;

chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
    "run",

], function (data) {

    if (data.run) {
        coefficient = + data.coefficient;
        selectLang = data.selectLang;
        CountRequesrs = 5;
        scanIntervalSET = + data.scanIntervalSET;
        errorPauseSET = + data.errorPauseSET;
        
    }
});
displaySearchRunScan();
function displaySearchRunScan() { 
    let divRunScan = document.getElementById("market_search");
    if (document.getElementById("runSearchScan") == null) {
        let buttonRunScan = document.createElement('div');
        let buttonReloadScan = document.createElement('div');
        let inputMinPrice = document.createElement('input');
        let inputMinProfit = document.createElement('input');
        let inputMinCount =  document.createElement('input');
        let inputMinSell = document.createElement('input');
        let inputOnlyProfitable = document.createElement('input');
        let span_inputMinPrice = document.createElement('span');
        let span_inputMinProfit = document.createElement('span');
        let span_inputMinCount =  document.createElement('span');
        let span_inputMinSell = document.createElement('span');
        let span_inputOnlyProfitable = document.createElement('span');
        inputMinPrice.setAttribute("type", "number");
        inputMinProfit.setAttribute("type", "number");
        inputMinCount.setAttribute("type", "number");
        inputMinSell.setAttribute("type", "number");
        inputOnlyProfitable.setAttribute("type", "checkbox");
        buttonRunScan.className = "market_search_advanced_button";
        buttonReloadScan.className = "market_search_advanced_button";
        span_inputMinPrice.className = "market_search_sidebar_section_tip_small market_listing_item_name";
        span_inputMinProfit.className = "market_search_sidebar_section_tip_small market_listing_item_name";
        span_inputMinCount.className = "market_search_sidebar_section_tip_small market_listing_item_name";
        span_inputMinSell.className = "market_search_sidebar_section_tip_small market_listing_item_name";
        span_inputOnlyProfitable.className = "market_search_sidebar_section_tip_small market_listing_item_name";
        buttonRunScan.id = "runSearchScan";
        buttonReloadScan.id = "reloadScan";
        inputMinPrice.id ="minPriceVal";
        inputMinProfit.id ="minProfitVal";
        inputMinCount.id ="minCountVal";
        inputMinSell.id ="minSellVal";
        inputOnlyProfitable.id ="onlyProfitable";
        span_inputMinPrice.textContent ="Min Price";
        span_inputMinProfit.textContent ="Min Profit";
        span_inputMinCount.textContent ="Min Count";
        span_inputMinSell.textContent ="Min Sell";
        span_inputOnlyProfitable.textContent ="only Profitable";
        buttonRunScan.textContent = "Run Scan";
        buttonReloadScan.textContent = "🗘";
        span_inputMinPrice.append(inputMinPrice);
        span_inputMinProfit.append(inputMinProfit);
        span_inputMinCount.append(inputMinCount);
        span_inputMinSell.append(inputMinSell);
        span_inputOnlyProfitable.append(inputOnlyProfitable);
        divRunScan.prepend(buttonRunScan);
        divRunScan.prepend(buttonReloadScan);
        divRunScan.prepend(span_inputOnlyProfitable);
        divRunScan.prepend(span_inputMinProfit);
        divRunScan.prepend(span_inputMinSell);
        divRunScan.prepend(span_inputMinCount);
        divRunScan.prepend(span_inputMinPrice);
        
    }
}
let StopScan = false;

function ordersReload(){
    let pageSize = 0;
    if (window.location.href.split('#', )[1]!== undefined) {
        pageSize = window.location.href.split('#', )[1].split('_', )[0].replace(/\D/g, '');
    }
    console.log(pageSize);
    changeSearchSize(pageSize);
    StopScan = true;
}
document.getElementById("reloadScan").addEventListener( "click" , () => {ordersReload();} );
document.getElementById("runSearchScan").addEventListener( "click" , () => {marketSearch(); StopScan = false;});

async function marketSearch() {
    let numberOfRepetitions = 10;
    let RereadTheAmountItems = async function (numberOfRepetitions) {
        let marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));
        if (numberOfRepetitions <= 0) {
            await waitTime((+errorPauseSET + Math.floor(Math.random() * 5)) * 60000);
            return RereadTheAmountItems(numberOfRepetitions = 10);
        }
        console.log(marketItems.length);
        if (marketItems.length > 0) {
            for (let index = 0; index < marketItems.length; index++) {
                if (StopScan) return;
                let orderHref = marketItems[index].href;
                let orderPrice = +marketItems[index].getElementsByClassName('normal_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
                let orderCount = +marketItems[index].getElementsByClassName('market_listing_num_listings_qty')[0].innerText.replace( /[^+\d]/g, '');
                var appId = marketItems[index].firstElementChild.dataset.appid;
                var aId = marketItems[index].firstElementChild.id;
                var hashName = encodeURIComponent(marketItems[index].firstElementChild.dataset.hashName);
                let minPriceVal = (document.getElementById("minPriceVal").value === undefined || document.getElementById("minPriceVal").value === null || document.getElementById("minPriceVal").value === '') ? 0 : document.getElementById("minPriceVal").value;
                let minCountVal = (document.getElementById("minCountVal").value === undefined || document.getElementById("minCountVal").value === null || document.getElementById("minCountVal").value === '') ? 0 : document.getElementById("minCountVal").value;
                let minProfitVal = (document.getElementById("minProfitVal").value === undefined || document.getElementById("minProfitVal").value === null || document.getElementById("minProfitVal").value === '') ? -Infinity : document.getElementById("minProfitVal").value;
                let minSellVal = (document.getElementById("minSellVal").value === undefined || document.getElementById("minSellVal").value === null || document.getElementById("minSellVal").value === '') ? 0 : document.getElementById("minSellVal").value;
                let onlyProfitable = (document.getElementById("onlyProfitable").checked === undefined || document.getElementById("onlyProfitable").checked === null || document.getElementById("onlyProfitable").checked === '') ? 0 : document.getElementById("onlyProfitable").checked;
                if (minPriceVal >= orderPrice ||  minCountVal >= orderCount) document.getElementById(aId).style.display = "none";
                let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
                let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
                let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                let priceHistory = await getItemHistory(appId, hashName, selectLang);
                let pricesProfit = InterVal(priceJSON, coefficient);
                if ( minProfitVal >= pricesProfit.actualProfit || minSellVal >= priceHistory.countSellSevenDays ) {
                    document.getElementById(aId).style.display = "none";
                }
                if (onlyProfitable && pricesProfit.coefPrice >= pricesProfit.actualProfit ) {
                    document.getElementById(aId).style.display = "none";
                    console.log(onlyProfitable, pricesProfit.coefPrice );
                }
                displayProfitable(pricesProfit, aId, priceJSON,  priceHistory); 
            }
            return;
        }
        ordersReload();
        await waitTime(5000 + scanIntervalSET + Math.floor(Math.random() * 50));
        marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));
        console.log(5000 + scanIntervalSET + Math.floor(Math.random() * 50));
        return RereadTheAmountItems(numberOfRepetitions - 1);
    }
    RereadTheAmountItems(numberOfRepetitions);
}

function InterVal(priceJSON, coefficient = 0.35) {
    let currentDiv = document.getElementById("largeiteminfo_item_descriptors");
    ProfitableList = {};
    ProfitableList.actualProfit = "Nan";
    ProfitableList.coefPrice = "Nan";
    ProfitableList.realPrice = "Nan";
    var priceWithoutFee = null;
    if (priceJSON.lowest_sell_order !== null && priceJSON.highest_buy_order !== null) {
        var inputValue = GetPriceValueAsInt(getNumber(`${priceJSON.lowest_sell_order/100}`));
        var nAmount = inputValue;
        if (inputValue > 0 && nAmount == parseInt(nAmount)) {
            var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nAmount = nAmount - feeInfo.fees;
            priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
        }
        ProfitableList.realPrice = getNumber(priceWithoutFee);
        ProfitableList.actualProfit = (ProfitableList.realPrice - (priceJSON.highest_buy_order/100)).toFixed(2);
        ProfitableList.coefPrice = ((priceJSON.highest_buy_order/100) * coefficient).toFixed(2);
    }
    return ProfitableList;
}

function displayProfitable(ProfitableList, aId, priceJSON, historySell) {
    let divItemBlock = document.getElementById(aId);
    let spanPriceBlock = divItemBlock.getElementsByClassName("normal_price")[0];
    let spanCountBlock = divItemBlock.getElementsByClassName("market_listing_num_listings_qty")[0];
    let spanRealPriceString = document.createElement('span');
    let spanActualProfitString = document.createElement('span');
    let spanCoefPriceString = document.createElement('span');
    let spanCountSale = document.createElement('span');
    let spanCountWeekSale = document.createElement('span');
    spanRealPriceString.innerText = "(" + ProfitableList.realPrice + ")";
    spanActualProfitString.innerText = "Profit: " + ProfitableList.actualProfit;
    spanCoefPriceString.innerText = "K. Profit: " + ProfitableList.coefPrice;
    spanCountSale.innerText = '1d sell: ' + historySell.countSell.toLocaleString();
    spanCountWeekSale.innerText = '7d sell: ' + historySell.countSellSevenDays.toLocaleString();
    spanRealPriceString.className = "normal_price";
    spanActualProfitString.className = "normal_price";
    spanCoefPriceString.className = "normal_price";
    spanCountSale.className = "market_listing_num_listings_qty";
    spanCountWeekSale.className = "market_listing_num_listings_qty";
    spanPriceBlock.append(spanRealPriceString);
    spanPriceBlock.prepend(spanActualProfitString);
    spanPriceBlock.prepend(spanCoefPriceString);
    spanCountBlock.append(spanCountSale);
    spanCountBlock.append(spanCountWeekSale);
    const OrderTable = priceJSON.sell_order_table + priceJSON.buy_order_table;
    const parser = new DOMParser();
    const parsed = parser.parseFromString(OrderTable, `text/html`);
    const tags = parsed.getElementsByTagName(`body`);
    for (const tag of tags) {
        divItemBlock.prepend(tag);
    }
    divItemBlock.style.backgroundColor = setSearchSolor(ProfitableList);
}
function setSearchSolor(ProfitableList){
    if (+ProfitableList.actualProfit > +ProfitableList.coefPrice) return "#09553c";
    if (+ProfitableList.actualProfit > 0.1 && +ProfitableList.actualProfit <= +ProfitableList.coefPrice) return "#61632b";
    if (+ProfitableList.actualProfit <= 0.1 ) return "#602F38";
}