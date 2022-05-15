changeSearchSize();
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
let buyOrderHeader = document.getElementById("findItems");
let html = `<div id="profitScaner" class="my_market_listing_table_header"></div> `;
buyOrderHeader.insertAdjacentHTML('afterend', DOMPurify.sanitize(html));

function searchHeadersNames() {
    //headersNames массив элементов
    let headersNames = {
        "Price":
        {
            "name": "Price",
            "dataSorttype": "price",
            "classSorttype": "market_listing_right_cell market_listing_their_price market_sortable_column"
        },
        "Count":
        {
            "name": "Count",
            "dataSorttype": "quantity",
            "classSorttype": "market_listing_right_cell market_listing_num_listings market_sortable_column",
        },
        "Buy_tab":
        {
            "name": "Buy_tab",
            "dataSorttype": "",
            "classSorttype": "market_listing_right_cell market_listing_my_orders",
        },
        "Sell_tab":
        {
            "name": "Sell_tab",
            "dataSorttype": "",
            "classSorttype": "market_listing_right_cell market_listing_my_orders",
        },
        "Name":
        {
            "name": "Name",
            "dataSorttype": "name",
            "classSorttype": "market_sortable_column market_listing_my_name",
        },
    };
    //!! наптсать вывод заголовка
    let profitScaner = document.getElementById("profitScaner");

    for (const key in headersNames) {
        let hederNamesHtml = `
    <div class="${headersNames[key].classSorttype} market_my_listing_${headersNames[key].name.toLowerCase()}" data-sorttype="${headersNames[key].dataSorttype}">
    ${headersNames[key].name}
    </div>
    `;
        profitScaner.insertAdjacentHTML('beforeend', DOMPurify.sanitize(hederNamesHtml));
    }
}
searchHeadersNames();
chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
    "runSearch",

], function (data) {

    if (data.runSearch) {
        coefficient = + data.coefficient;
        selectLang = data.selectLang;
        CountRequesrs = 5;
        scanIntervalSET = + data.scanIntervalSET;
        errorPauseSET = + data.errorPauseSET;

        displaySearchRunScan();
        getPageSizeInSearch(CountRequesrs, scanIntervalSET, errorPauseSET);

    }
});

async function displaySearchRunScan() {
    let divRunScan = document.getElementById("market_search");
    if (document.getElementById("runSearchScan") == null) {
        let scanerMarketSearchHTML = `
        <div>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                Price From
                <input type="number" id="priceFromVal">
            </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
            Price To
            <input type="number" id="priceToVal">
        </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                Min Count
                <input type="number" id="minCountVal">
            </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                Min Sell
                <input type="number" id="minSellVal">
            </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                Min Profit
                <input type="number" id="minProfitVal">
            </span>
            <br>
            <br>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                only Profitable
                <input type="checkbox" id="onlyProfitable">
            </span>
            <br>
            <div class="selectBlock">
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                StartPage
                <select id="StartPageNumber" name="select">
                </select>
            </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                EndPage
                <select id="EndPageNumber" name="select">
                </select>
            </span>

            <span class="market_search_sidebar_section_tip_small market_listing_item_name" id ="numberOfOperations">
            0
            </span>

            <span class="market_search_sidebar_section_tip_small market_listing_item_name" id ="operationsProcess">
            0
            </span>
            </div>

            <div class="SearchButton">
                <div class="market_search_advanced_button" id="reloadScan">🗘</div>
                <div class="market_search_advanced_button" id="runSearchScan">Run Scan</div>
                <div class="market_search_advanced_button" id="runLoadOrder">Run Load</div>
            </div>
        </div>
        `;
        divRunScan.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(scanerMarketSearchHTML));

    }
}
let StopScan = false;

function ordersReload() {
    let pageSize = 0;
    if (window.location.href.split('#',)[1] !== undefined) {
        pageSize = window.location.href.split('#',)[1].split('_',)[0].replace(/\D/g, '');
    }
    console.log(pageSize);
    changeSearchSize(pageSize);
    StopScan = true;
}

async function getPageSizeInSearch(CountRequesrs, scanIntervalSET, errorPauseSET) {
    document.getElementById("reloadScan").addEventListener("click", () => { ordersReload(); });
    document.getElementById("runSearchScan").addEventListener("click", () => { marketSearch(); StopScan = false; });

    /**
     * https://steamcommunity.com/market/search?select=value2&select=value2&select=value2&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=tag_weapon_knife_flip&appid=730&q=#p2_popular_desc
     * https://steamcommunity.com/market/search?select=0&select=100&appid=730&q=Dreams#p1_default_desc
     * https://steamcommunity.com/market/search?select=0&select=100&select=100&appid=730&q=#p1_popular_desc
     */

    let searchUrlСategory = window.location.href.match(/category(.*)/);
    let marketSeachInfo;
    let ArraySortingAppidObject;
    let Urlfragment;

    let getArraySortingAppid = function (searchUrl) {
        if (searchUrl !== null) {
            let appId = searchUrl.input.match(/(?<=appid\=)\d*/)[0];
            let AppidSortingVal = searchUrl.input.match(/(?<=\#).*/)[0];
            let arraySortingVal = AppidSortingVal.split("_");
            return { appId, arraySortingVal };
        }
    }

    async function ServerRequestAddSearchResults(searchUrlСategory, start = 0, count = 100) {
        if (searchUrlСategory !== null) {
            ArraySortingAppidObject = getArraySortingAppid(searchUrlСategory);
            if (ArraySortingAppidObject) {

                let categoryVal;
                let categoryString = searchUrlСategory.input.match(/category.*(?=\&)/g);

                if (categoryString) {
                    categoryVal = searchUrlСategory.input.match(/category.*(?=\&)/g).join('&');
                } else {
                    categoryVal = searchUrlСategory.input.match(/category.*(?=\#)/g).join('&');
                }

                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                Urlfragment = `https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=${count}&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&${categoryVal}`;
                marketSeachInfo = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=0&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&${categoryVal}`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
        } else {
            let searchUrl = window.location.href.match(/search\?(.*)/);
            let ArraySortingAppidObject = getArraySortingAppid(searchUrl);
            if (ArraySortingAppidObject) {
                Urlfragment = `https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=0&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}`;
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfo = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=0&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
        }
        return marketSeachInfo;
    }

    let queryItem = document.getElementById("findItemsSearchBox");
    if (queryItem !== null) {
        let marketSeachInfo = await ServerRequestAddSearchResults(searchUrlСategory);
        const pageSize = Math.ceil(marketSeachInfo.total_count / 100);

        selectBlockPagesize(["StartPageNumber", "EndPageNumber"], pageSize);
    }

    let runLoadOrder = document.getElementById("runLoadOrder");

    runLoadOrder.onclick = async function () {
        StartPageNumber = +document.getElementById("StartPageNumber").value;
        EndPageNumber = +document.getElementById("EndPageNumber").value;
        if (StartPageNumber !== null && EndPageNumber !== null) {
            let CountLoaders = EndPageNumber - StartPageNumber;
            let changeCountLoaders = CountLoaders;

            if (changeCountLoaders <= 0) return;
            for (let index = 0; index < CountLoaders; index += 100) {
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                let marketSeachJSON = await ServerRequestAddSearchResults(searchUrlСategory);

                let myCustomMarketTableHTML = document.getElementById("BG_bottom");
                myCustomMarketTableHTML.insertAdjacentHTML('beforeend', marketSeachJSON.results_html);
                document.getElementById("numberOfOperations").textContent = `(${CountLoaders})`;
                document.getElementById("operationsProcess").textContent = `(${index + 100})`;
            }
        }

    }
    /*
    нумерация не работает
    https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_416450#p1_popular_desc
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&query=usp&appid=730&query=usp
    */
}
function selectBlockPagesize(idArr, pageSize) {
    idArr.forEach((idVal, indexArr) => {
        let ElementDom = document.getElementById(idVal);
        for (let index = 0; index < pageSize; index++) {
            ElementDom.insertAdjacentHTML('beforeend', `<option value="${(+index + indexArr) * 100}">${(+index + indexArr) * 100}</option>`);
        }
    });
}

/* 
https://steamcommunity.com/market/search/render/?query=q&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730

https://steamcommunity.com/market/search/render/?query=s&start=100&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=tag_weapon_usp_silencer */


/*  let searchUrl = window.location.href.match(/search\?(.*)/); */// 1: "appid=730#p2_popular_desc" https://steamcommunity.com/market/search?appid=730#p1_popular_desc
// 1: "appid=730#p2_popular_desc" https://steamcommunity.com/market/search?appid=730#p1_popular_desc
/*  
    https://steamcommunity.com/market/search?select=value2&select=value2&select=value2&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=tag_weapon_knife_flip&appid=730&q=#p2_popular_desc

    category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2
    https://steamcommunity.com/market/search?q=&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2&appid=730#p2_popular_desc
    https://steamcommunity.com/market/search/render/?query=&start=10&count=10&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2      */

async function marketSearch() {
    let numberOfRepetitions = 10;
    let marketItems;
    let RereadTheAmountItems = async function (numberOfRepetitions) {
        marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));
        if (numberOfRepetitions <= 0) {
            await waitTime((+errorPauseSET + Math.floor(Math.random() * 5)) * 60000);
            return RereadTheAmountItems(numberOfRepetitions = 10);
        }

        if (marketItems.length > 0) {
            for (let index = 0; index < marketItems.length; index++) {
                if (StopScan) return;

                if (marketItems[index].firstElementChild.dataset.scanned === undefined) {

                    //!! повторяется надо будет исправить
                    let blockNames = ["Buy_tab", "Sell_tab"];
                    for (const key in blockNames) {
                        countBlock = marketItems[index].getElementsByClassName(" market_listing_price_listings_block")[0];
                        let myItemBlocksHTML = `<div class="market_listing_right_cell market_listing_my_price market_my_listing_${blockNames[key].toLowerCase()}"></div>`;
                        countBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(myItemBlocksHTML));
                    }

                    let orderHref = marketItems[index].href;
                    let orderPrice = +marketItems[index].getElementsByClassName('normal_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
                    let orderCount = +marketItems[index].getElementsByClassName('market_listing_num_listings_qty')[0].innerText.replace(/[^+\d]/g, '');
                    var appId = marketItems[index].firstElementChild.dataset.appid;
                    /* var aId = marketItems[index].firstElementChild.id; */
                    var hashName = fixedEncodeURIComponent(marketItems[index].firstElementChild.dataset.hashName);
                    let priceFromVal = document.getElementById("priceFromVal").value || 0;
                    let priceToVal = document.getElementById("priceToVal").value || Infinity;
                    let minCountVal = document.getElementById("minCountVal").value || -1;
                    let minProfitVal = document.getElementById("minProfitVal").value || -Infinity;
                    let minSellVal = document.getElementById("minSellVal").value || 0;
                    let onlyProfitable = document.getElementById("onlyProfitable").checked || false;

                    let sourceCode = await globalThis.httpErrorPause(orderHref, CountRequesrs, scanIntervalSET, errorPauseSET);
                    let item_id = sourceCode.match(/Market_LoadOrderSpread\(\s*(\d+)\s*\);/)["1"];
                    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', CountRequesrs, scanIntervalSET, errorPauseSET));
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                    let priceHistory = await getItemHistory(appId, hashName, selectLang);

                    let pricesProfit = InterVal(priceJSON, coefficient);

                    if (priceFromVal > orderPrice || priceToVal < orderPrice || minCountVal > orderCount) {
                        marketItems[index].style.display = "none";
                    } else if (minProfitVal > pricesProfit.actualProfit || minSellVal > priceHistory.countSellSevenDays) {
                        marketItems[index].style.display = "none";
                    } else if (onlyProfitable && pricesProfit.coefPrice > pricesProfit.actualProfit) {
                        marketItems[index].style.display = "none";
                    } else {
                        await displayProfitable(pricesProfit, marketItems[index], priceJSON, priceHistory, item_id);
                    }
                }
            }
            return;
        }
        ordersReload();
        await waitTime(5000 + scanIntervalSET + Math.floor(Math.random() * 50));
        marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));

        return RereadTheAmountItems(numberOfRepetitions - 1);
    }
    RereadTheAmountItems(numberOfRepetitions);
}

async function displayProfitable(pricesProfit, divItemBlock, priceJSON, priceHistory, item_id) {

    let spanPriceBlock = divItemBlock.getElementsByClassName("normal_price")[0];
    let sellsHistoryHTML = `
        <span class="market_listing_num_listings_qty">1d sell: ${priceHistory.countSell.toLocaleString()}</span>
        <span class="market_listing_num_listings_qty">7d sell: ${priceHistory.countSellSevenDays.toLocaleString()}</span>`;
    spanPriceBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sellsHistoryHTML));

    let spanCountBlock = divItemBlock.getElementsByClassName("market_listing_num_listings_qty")[0];
    let ProfitItemHTML = `
    <span class="market_listing_num_listings_qty">K. Profit: ${pricesProfit.coefPrice}</span>
    <span class="market_listing_num_listings_qty">Profit: ${pricesProfit.actualProfit}</span>
    `;
    spanCountBlock.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(ProfitItemHTML));

    let realPriceHTML = `<span class="normal_price">(${pricesProfit.realPrice})</span>`;
    spanPriceBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(realPriceHTML));

    let myListingSellTabHTML = `<span class="market_table_value market_table_price_json_sell">${priceJSON.sell_order_table}</span>`;
    divItemBlock.getElementsByClassName("market_my_listing_sell_tab")[0].insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingSellTabHTML));

    let myListingBuyTabHTML = `<span class="market_table_value market_table_price_json_buy">${priceJSON.buy_order_table}</span>`;
    divItemBlock.getElementsByClassName("market_my_listing_buy_tab")[0].insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyTabHTML));

    let historyChartHTML = `   
    <div id="chart_${item_id}">
        <div id="chart-timeline_${item_id}"></div>
        <div id="chart-map_${item_id}"></div>
    </div>`;
    divItemBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(historyChartHTML));
    let minMaxPricePerDayVal = await minMaxPricePerDay(priceHistory.historyPriceJSON.prices);

    if (minMaxPricePerDayVal !== undefined && minMaxPricePerDayVal.length > 1) {
        await schemeHistory(minMaxPricePerDayVal, item_id);
    }

    divItemBlock.firstElementChild.style.backgroundColor = setSearchSolor(pricesProfit);
    divItemBlock.firstElementChild.dataset.scanned = "true";
}

async function schemeHistory(countArrYear, item_id) {

    if (countArrYear.length === 0 || countArrYear.length === 1) return;
    let nowTime = Date.parse(new Date);
    let lastThirtyDaysMs = nowTime - (1000 * 60 * 60 * 24 * 30);

    let saleArr = countArrYear.map((item) => [Date.parse(item[0]), item[1]]);
    let countArr = countArrYear.map((item) => [Date.parse(item[0]), item[2]]);

    let firstData = countArrYear.shift()[0];
    let lastData = countArrYear.pop()[0];

    var options = {
        series: [{
            name: 'Sale Price',
            type: 'area',
            data: saleArr
        },
        {
            name: 'Count Sale',
            type: 'line',
            data: countArr,
        }],
        chart: {
            id: `chart-price-history${item_id}`,
            height: 350,
            type: 'line',
            zoom: {
                autoScaleYaxis: true
            }
        },
        dataLabels: {
            /* enabled: true,
            enabledOnSeries: [1] */
        },
        markers: {
            size: 0,
            colors: ["#000524"],
            strokeColor: "#ffe339",
            strokeWidth: 3
        },
        grid: {
            borderColor: "#555",
            clipMarkers: false,
        },
        //ось x
        xaxis: {
            type: 'datetime',
            min: firstData,
            tickAmount: 6,
        },
        // ось y
        yaxis: [
            {
                title: {
                    text: "Price",
                    style: {
                        color: "#FF1654"
                    }
                }
            },
            {
                opposite: true,
                title: {
                    text: "Count",
                    style: {
                        color: "#FF1654"
                    }
                }
            },
        ],
        tooltip: {
            x: {
                format: 'dd MMM yyyy'
            }
        },
        // стиль таблицы  fill
        fill: {
            type: 'solid',
            opacity: [0.35, 1],
        }
    };

    var chart = new ApexCharts(document.querySelector(`#chart-timeline_${item_id}`), options);
    chart.render();

    var optionsMap = {
        chart: {
            id: `map-price-history${item_id}`,
            height: 130,
            type: "bar",
            foreColor: "#ccc",

            brush: {
                target: `chart-price-history${item_id}`,
                enabled: true
            },

            selection: {
                enabled: true,
                fill: {
                    color: "#fff",
                    opacity: 0.4
                },
                xaxis: {
                    min: lastThirtyDaysMs,
                    max: lastData
                }
            }

        },
        colors: ["#FF0080"],
        series: [
            {
                data: saleArr
            }
        ],
        stroke: {
            width: 2
        },
        grid: {
            borderColor: "#444"
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: "datetime",
            tooltip: {
                enabled: false
            }
        },
        yaxis: {
            tickAmount: 2
        }
    };

    var chart = new ApexCharts(document.querySelector(`#chart-map_${item_id}`), optionsMap);
    chart.render();

}

async function minMaxPricePerDay(priceArr) {

    let nowTime = Date.parse(new Date);
    let lastYearMs = nowTime - (1000 * 60 * 60 * 24 * 30 * 12);
    let countArrYear = priceArr.map((item) => Date.parse(item[0]) > lastYearMs ? item : undefined).filter(Boolean);

    let chartsArr = [];
    let dublicateArr = [];
    let pastDate;
    countArrYear.map((priceHistoryData) => {

        const timeformat = new Date(priceHistoryData[0]).toLocaleDateString();

        if (priceHistoryData.length === 0) return;

        if (pastDate !== undefined && pastDate === timeformat) {
            dublicateArr.push(priceHistoryData);
        } else {
            pastDate = timeformat;
            let minVal;
            let maxVal;
            let countVal = 0;
            if (dublicateArr.length > 0 && dublicateArr.length !== 1) {
                dublicateArr.map((dublicateItem) => {
                    if (dublicateItem[1] < minVal || minVal === undefined) {
                        minVal = dublicateItem[1];
                    }

                    if (dublicateItem[1] > maxVal || maxVal === undefined) {
                        maxVal = dublicateItem[1];
                    }
                    countVal += +dublicateItem[2];
                });
                if (minVal === maxVal) {
                    chartsArr.push([priceHistoryData[0], minVal, countVal]);
                } else {
                    chartsArr.push([priceHistoryData[0], maxVal, countVal]);
                }
                dublicateArr = [];
                return;
            }
            dublicateArr = [];
            chartsArr.push(priceHistoryData);
        }

    });

    return chartsArr;
}

function InterVal(priceJSON, coefficient = 0.35) {
    let currentDiv = document.getElementById("largeiteminfo_item_descriptors");
    ProfitableList = {};
    ProfitableList.actualProfit = "Nan";
    ProfitableList.coefPrice = "Nan";
    ProfitableList.realPrice = "Nan";
    var priceWithoutFee = null;
    if (priceJSON.lowest_sell_order !== null && priceJSON.highest_buy_order !== null) {
        var inputValue = GetPriceValueAsInt(getNumber(`${priceJSON.lowest_sell_order / 100}`));
        var nAmount = inputValue;
        if (inputValue > 0 && nAmount == parseInt(nAmount)) {
            var feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
            nAmount = nAmount - feeInfo.fees;
            priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
        }
        ProfitableList.realPrice = getNumber(priceWithoutFee);
        ProfitableList.actualProfit = (ProfitableList.realPrice - (priceJSON.highest_buy_order / 100)).toFixed(2);
        ProfitableList.coefPrice = ((priceJSON.highest_buy_order / 100) * coefficient).toFixed(2);
    }
    return ProfitableList;
}

function setSearchSolor(ProfitableList) {
    if (+ProfitableList.actualProfit > +ProfitableList.coefPrice) return "#09553c";
    if (+ProfitableList.actualProfit > 0.1 && +ProfitableList.actualProfit <= +ProfitableList.coefPrice) return "#61632b";
    if (+ProfitableList.actualProfit <= 0.1) return "#602F38";
}