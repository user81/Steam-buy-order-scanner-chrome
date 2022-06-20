changeSearchSize();
var g_rgWalletInfo = {
    wallet_fee: 1,
    wallet_fee_base: 0,
    wallet_fee_minimum: 1,
    wallet_fee_percent: 0.05,
    wallet_publisher_fee_percent_default: 0.10,
    wallet_currency: 1
};

let sizePage;
let orderListBuyArr;
let orderListBuyJSONArr;
let buyOrderHeader = document.getElementById("findItems");
let html = `<div id="profitScaner" class="my_market_listing_table_header"></div> `;
buyOrderHeader.insertAdjacentHTML('afterend', DOMPurify.sanitize(html));

let DomRemove = (Dom) => { if (Dom !== undefined) Dom.remove() };

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
    "quantity",
    "runSearch",

], function (data) {

    if (data.runSearch) {
        sessionId = SessionIdVal();

        displaySearchRunScan(data.coefficient);
        getPageSizeInSearch(5, data.quantity, data.coefficient, data.selectLang, data.scanIntervalSET, data.errorPauseSET, SessionIdVal());

    }
});

async function displaySearchRunScan(coefficient) {
    let divRunScan = document.getElementById("market_search");
    if (document.getElementById("runSearchScan") == null) {
        let scanerMarketSearchHTML = `
        <div>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                Price From
                <input type="number" id="priceFromVal" step="0.01">
            </span>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
            Price To
            <input type="number" id="priceToVal" step="0.01">
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
                <input type="number" id="minProfitVal" value ="">
            </span>
            <br>
            <br>
            <span class="market_search_sidebar_section_tip_small market_listing_item_name">
                only Profitable
                <input type="checkbox" id="onlyProfitable">
            </span>
            <br>
            <div class="selectBlock">
            <div class="multiselect">
                <div class="selectBox" id="selectPage">
                    <select class="selectLang" id="selectOptionVal">
                        <option>Pages</option>
                    </select>
                    <div class="overSelect"></div>
                </div>
                <div id="checkboxes">

                </div>
            </div>

            </div>

            <div class="myProgressLine" id="myProgresLoading">
                <div class ="myBarsLine">
                <span class ="myBarsContent" id ="numberOfOperations"> </span>
                <span class ="myBarsContent" id ="separatorOfOperations"> </span>
                <span class ="myBarsContent" id ="operationsProcess"> </span>
                <span class ="myBarsContent" id ="tupeOfOperations"> </span>
                </div>
                <span class ="percentageOfCompletion" style="display: none">0</span>
            </div>

            <div class="SearchButton">
                <div class="market_search_advanced_button" id="reloadScan">🗘</div>
                <div class="market_search_advanced_button" id="runSearchScan">Run Scan</div>
                <div class="market_search_advanced_button" id="runLoadOrder">Run Load</div>
            </div>
        </div>
        `;
        divRunScan.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(scanerMarketSearchHTML));
        lineBarRender();
    }
}
let StopScan = false;

function ordersReload() {
    let pageSize = 0;
    if (window.location.href.split('#',)[1] !== undefined) {
        pageSize = window.location.href.split('#',)[1].split('_',)[0].replace(/\D/g, '');
    }

    changeSearchSize(pageSize);
    StopScan = true;
}
var expanded = false;
function showCheckboxes() {
    let checkboxes = document.getElementById("checkboxes");
    let selectOptionVal = document.getElementById("selectOptionVal");
    let textActive = "#d9c859"
    let textDefault = "#fff"
    if (!expanded) {
        checkboxes.style.display = "block";
        selectOptionVal.style.color = textActive;
        expanded = true;
        let checkboxList = document.getElementsByClassName("select-input-value-checkbox");
        if (checkboxList.length !== 0) {

            Array.prototype.map.call(checkboxList, (currentDom) => {
                currentDom.addEventListener("click", (event) => { changeLabelColor(event.path[0], textDefault, textActive); });
                if (currentDom.checked) {
                    currentDom.parentElement.style.color = textActive;
                }
            });

        }
    } else {
        selectOptionVal.style.color = textDefault;
        checkboxes.style.display = "none";
        expanded = false;
    }
}
let changeLabelColor = (thisDom, textDefault, textActive) => thisDom.parentElement.style.color = thisDom.checked ? textActive : textDefault;

async function getPageSizeInSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId) {
    document.getElementById("reloadScan").addEventListener("click", () => { ordersReload(); });
    document.getElementById("selectPage").addEventListener("click", () => { showCheckboxes(); });
    document.getElementById("runSearchScan").addEventListener("click", () => {
        marketSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId); StopScan = false;
    });

    /**
     * https://steamcommunity.com/market/search?select=value2&select=value2&select=value2&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=tag_weapon_knife_flip&appid=730&q=#p2_popular_desc
     * https://steamcommunity.com/market/search?select=0&select=100&appid=730&q=Dreams#p1_default_desc
     * https://steamcommunity.com/market/search?select=0&select=100&select=100&appid=730&q=#p1_popular_desc
     */

    let searchUrlСategory = window.location.href.match(/category(.*)/);
    let marketSeachInfo;
    let marketSeachInfoNorender;
    let ArraySortingAppidObject;
    let Urlfragment;

    let getArraySortingAppid = function (searchUrl) {
        if (searchUrl !== null) {

            let appIdMatch = searchUrl.input.match(/(?<=appid\=)\d*/);
            let AppidSortingValMatch = searchUrl.input.match(/(?<=\#).*/);
            let appId = appIdMatch !== null ? appIdMatch[0] : null;
            let AppidSortingVal = AppidSortingValMatch !== null ? AppidSortingValMatch[0] : null;

            let arraySortingVal = AppidSortingVal !== null ? AppidSortingVal.split("_") : ['p', 'default', 'desc'];
            arraySortingVal[2] = arraySortingVal[2].includes('desc') ? 'desc' : 'asc';
            return { appId, arraySortingVal };
        }
    }

    async function ServerRequestAddSearchResults(searchUrlСategory, start = 0, count = 100) {
        if (searchUrlСategory !== null) {
            ArraySortingAppidObject = getArraySortingAppid(searchUrlСategory);
            if (ArraySortingAppidObject) {

                let categoryVal;
                let categoryStringAnd = searchUrlСategory.input.match(/category.*(?=\&)/g);
                let categoryStringHashtag = searchUrlСategory.input.match(/category.*(?=\#)/g);
                if (categoryStringAnd) {
                    categoryVal = categoryStringAnd.join('&');
                } else if (categoryStringHashtag) {
                    // для ссылок https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_416450#p1_popular_desc
                    categoryVal = searchUrlСategory.input.match(/category.*(?=\#)/g).join('&');
                }
                if (categoryVal && ArraySortingAppidObject.appId) {
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                    marketSeachInfo = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&${categoryVal}`, CountRequesrs, scanIntervalSET, errorPauseSET));
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                    marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&${categoryVal}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                }
            }
        } else {
            let searchUrl = window.location.href.match(/search\?(.*)/);
            let ArraySortingAppidObject = getArraySortingAppid(searchUrl);
            if (ArraySortingAppidObject && ArraySortingAppidObject.appId) {
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfo = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
            if (ArraySortingAppidObject && ArraySortingAppidObject.appId === null) {
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfo = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
        }
        return { marketSeachInfo, marketSeachInfoNorender };
    }

    let queryItem = document.getElementById("findItemsSearchBox");
    if (queryItem !== null) {
        let { marketSeachInfo, marketSeachInfoNorender } = await ServerRequestAddSearchResults(searchUrlСategory);
        const pageSize = Math.ceil(marketSeachInfo.total_count / 100);

        selectPageCheckbox(pageSize, marketSeachInfo);
        orderListBuyJSONArr = marketSeachInfoNorender.results;

    }

    let runLoadOrder = document.getElementById("runLoadOrder");


    runLoadOrder.onclick = async function () {
        let checkboxBlock = document.getElementsByClassName("select-input-value-checkbox");
        let pagesArr =[];
        if (checkboxBlock.length !== 0) {
            Array.prototype.map.call(checkboxBlock, (currentDom) => {
                if (currentDom.checked === true && !isNaN(currentDom.value)){
                    currentDom.disabled = true;
                    pagesArr.push(currentDom.value);
                    }
            });
        }

        //линия загрузки lineBarRender
        
        let loadinCount = 0;
        lineBarRender();
        for (let loadinProgres = 0; loadinProgres < pagesArr.length; loadinProgres++) {
            
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            let { marketSeachInfo, marketSeachInfoNorender } = await ServerRequestAddSearchResults(searchUrlСategory, pagesArr[loadinProgres]);

            let myCustomMarketTableHTML = document.getElementById("searchResultsRows");
            myCustomMarketTableHTML.insertAdjacentHTML('afterend', DOMPurify.sanitize(marketSeachInfo.results_html));
            orderListBuyJSONArr = [...orderListBuyJSONArr, ...marketSeachInfoNorender.results];
            let numberOfOperations = document.getElementById("numberOfOperations");
            let separatorOfOperations = document.getElementById("separatorOfOperations");
            let operationsProcess = document.getElementById("operationsProcess");
            let tupeOfOperations = document.getElementById("tupeOfOperations");
            
            numberOfOperations.textContent = `${pagesArr.length}`;
            separatorOfOperations.textContent = '/';
            operationsProcess.textContent = `${++loadinCount}`;
            tupeOfOperations.textContent = "page";

            // линия загрузки
            let widthVal = lineBarWidth(loadinCount, pagesArr.length);
            let myProgresLoading = document.getElementById("myProgresLoading");
            myProgresLoading.getElementsByClassName("percentageOfCompletion")[0].textContent =widthVal;
            
        }

    }

    /*    https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_416450#p1_popular_desc
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&query=usp&appid=730&query=usp
    

https://steamcommunity.com/market/search/render/?query=&start=0&count=100&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=753&category_753_Game%5B%5D=tag_app_416450
https://steamcommunity.com/market/search/render/?query=&start=100&count=100&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=753&category_753_Game[]=tag_app_416450

    !!!нумерация не работает
    https://steamcommunity.com/market/search?q=%D0%A1%D1%83%D0%B2%D0%B5%D0%BD%D0%B8%D1%80%D0%BD%D1%8B%D0%B9+%D0%BD%D0%B0%D0%B1%D0%BE%D1%80#p1_default_desc
    https://steamcommunity.com/market/search?appid=730#p1_popular_desc&norender=1
    */
}

function selectPageCheckbox(pageSize, marketSeachInfo) { 
    let checkBoxBlock = document.getElementById("checkboxes");
    for (let index = 0; index < pageSize; index++) {
        checkBoxBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`  
        <label for="checkboxes_page_${+index + 1}">
            <input type="checkbox" id="checkboxes_page_${+index + 1}" value="${(+index) * 100}" class="select-input-value-checkbox" />${+index + 1}
        </label>`));
    }

    let myCustomMarketTableHTML = document.getElementById("searchResultsRows");
    myCustomMarketTableHTML.textContent = '';
    myCustomMarketTableHTML.innerHTML = DOMPurify.sanitize(marketSeachInfo.results_html);
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

async function marketSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId) {
    let numberOfRepetitions = 10;
    let marketItems;
    let RereadTheAmountItems = async function (numberOfRepetitions) {
        marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));
        if (numberOfRepetitions <= 0) {
            await waitTime((+errorPauseSET + Math.floor(Math.random() * 5)) * 60000);
            return RereadTheAmountItems(numberOfRepetitions = 10);
        }

        if (marketItems.length > 0) {
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            let myListings = JSON.parse(await globalThis.httpErrorPause("https://steamcommunity.com/market/mylistings/?norender=1", CountRequesrs, scanIntervalSET, errorPauseSET));
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            orderListArr = myListings.buy_orders; // массив значений товаров
            orderListBuyArr = orderListArr; //чобы работали кнопки отменить разместить заказ иначе они обуляются при вызове

            for (let index = 0; index < marketItems.length; index++) {
                if (StopScan) return;

                let asset_description = orderListBuyJSONArr[index].asset_description;
                console.log(orderListBuyJSONArr);
                console.log(marketItems[index].firstElementChild.dataset);
                if (marketItems[index].firstElementChild.dataset.scanned === undefined || marketItems[index].firstElementChild.dataset.scanned === 'update') {

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
                        myNextBuyPrice = NextPrice(priceJSON.highest_buy_order, "higest");
                        /* myRealBuyPrice = NextPrice(priceJSON.highest_buy_order, "real"); */
                        await displayProfitable(marketItems[index], priceJSON, priceHistory, { item_id, asset_description }, myNextBuyPrice, quantity, { CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET });
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

async function displayProfitable(divItemBlock, priceJSON, priceHistory, item_description, myNextBuyPrice, quantity, extensionSetings) {
    let { item_id } = item_description;
    let pricesProfit = InterVal(priceJSON, extensionSetings.coefficient);
    let spanPriceBlock = divItemBlock.getElementsByClassName("normal_price")[0];
    let spanCountBlock = divItemBlock.getElementsByClassName("market_listing_num_listings_qty")[0];

    DomRemove(spanPriceBlock.getElementsByClassName("market_sells")[0]);
    MarketSells(spanPriceBlock, priceHistory);

    DomRemove(spanCountBlock.getElementsByClassName("market_prifit")[0]);
    marketPrifit(spanCountBlock, pricesProfit);

    DomRemove(spanPriceBlock.getElementsByClassName("normal_price")[0]);
    realPrice(spanPriceBlock, pricesProfit);

    DomRemove(divItemBlock.getElementsByClassName("market_table_price_json_sell")[0]);
    listingSellTab(divItemBlock, priceJSON);

    DomRemove(divItemBlock.getElementsByClassName("market_table_price_json_buy")[0]);
    listingBuyTab(divItemBlock, priceJSON);

    DomRemove(divItemBlock.getElementsByClassName("chart")[0]);
    historyChart(divItemBlock, item_id);

    let minMaxPricePerDayVal = await minMaxPricePerDay(priceHistory.historyPriceJSON.prices);
    DomRemove(document.getElementsByClassName(`order_block_${item_id}`)[0]);
    itemOrderChange(item_description, divItemBlock, myNextBuyPrice, quantity, extensionSetings, priceJSON, minMaxPricePerDayVal, setSearchSolor(pricesProfit), sessionId);

    divItemBlock.firstElementChild.style.backgroundColor = setSearchSolor(pricesProfit);
    divItemBlock.firstElementChild.dataset.scanned = "true";
}

function MarketSells(spanPriceBlock, priceHistory) {
    let sellsHistoryHTML = `
    <div class ="market_sells">
        <span class="market_listing_num_listings_qty">1d sell: ${priceHistory.countSell.toLocaleString()}</span>
        <span class="market_listing_num_listings_qty">7d sell: ${priceHistory.countSellSevenDays.toLocaleString()}</span>
    </div>`;

    spanPriceBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sellsHistoryHTML));
}

function marketPrifit(spanCountBlock, pricesProfit) {
    let ProfitItemHTML = `
    <div class = "market_prifit">
        <span class="market_listing_num_listings_qty">K. Profit: ${pricesProfit.coefPrice}</span>
        <span class="market_listing_num_listings_qty">Profit: ${pricesProfit.actualProfit}</span>
    </div>`;
    spanCountBlock.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(ProfitItemHTML));
}

function realPrice(spanPriceBlock, pricesProfit) {
    let realPriceHTML = `<span class="normal_price">(${pricesProfit.realPrice})</span>`;
    spanPriceBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(realPriceHTML));
}

function listingSellTab(divItemBlock, priceJSON) {
    let myListingSellTabHTML = `<span class="market_table_value market_table_price_json_sell">${priceJSON.sell_order_table}</span>`;
    let listingSell = divItemBlock.getElementsByClassName("market_my_listing_sell_tab")[0];
    listingSell.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingSellTabHTML));
}

function listingBuyTab(divItemBlock, priceJSON) {
    let myListingBuyTabHTML = `<span class="market_table_value market_table_price_json_buy">${priceJSON.buy_order_table}</span>`;
    divItemBlock.getElementsByClassName("market_my_listing_buy_tab")[0].insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyTabHTML));
}

function historyChart(divItemBlock, item_id) {
    let historyChartHTML = `   
    <div id="chart_${item_id}" class="chart">
        <div id="chart-timeline_${item_id}"></div>
        <div id="chart-map_${item_id}"></div>
    </div>`;
    divItemBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(historyChartHTML));
}



function itemOrderChange(item_description, myListingBuyUpdateDom, myNextBuyPrice, quantityWant, extensionSetings, priceJSON, minMaxPricePerDayVal, color, sessionId) {

    let { item_id } = item_description;
    let myListingBuyUpdateHTML = `
    <span class="market_search_sidebar_contents change_price_search  market_table_value change_price_block order_block_${item_id}"
    style ="box-shadow: rgb(62 70 55 / 59%) 0px 0px 32px 38px inset;"
    >
        <span id="myItemRealBuyPrice${item_id}">${myNextBuyPrice.nextPriceWithoutFee}</span>
        <span id="myItemNextBuyPrice${item_id}">${myNextBuyPrice.myNextPrice}</span>
        <input type="number" step="0.01" id="myItemBuyPrice${item_id}" class="change_price_input">
        <input type="number" id="myItemQuality${item_id}" class="change_price_input">
        <button id="cancelBuyOrder_${item_id}" class = "market_searchedForTerm"> ⦸ </button>
        <button id="createBuyOrder_${item_id}" class = "market_searchedForTerm"> ⨭ </button>
        <button id="showHistory_${item_id}" class = "market_searchedForTerm"> show history </button>
        <div id="responceServerRequestBuyOrder_${item_id}"></div>
    </span>`;
    myListingBuyUpdateDom.insertAdjacentHTML('beforebegin', DOMPurify.sanitize(myListingBuyUpdateHTML));
    let buttonCancelBuy = document.getElementById(`cancelBuyOrder_${item_id}`);
    let buttonCreateBuy = document.getElementById(`createBuyOrder_${item_id}`);
    let buttonshowHistory = document.getElementById(`showHistory_${item_id}`);
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
    buttonCreateBuy.addEventListener("click", (event) => { createBuyOrder(event.path[0], extensionSetings, sessionId, item_description); });
    buttonshowHistory.addEventListener("click", (event) => {
        if (minMaxPricePerDayVal !== undefined && minMaxPricePerDayVal.length > 1) {
            schemeHistory(minMaxPricePerDayVal, item_id);
        }
    });

    buttonCancelBuy.addEventListener("click", (event) => { cancelBuyOrder(event.path[0], extensionSetings, sessionId, item_description); });
    let orderBlockDom = document.getElementsByClassName(`order_block_${item_id}`);
    Array.prototype.map.call(orderBlockDom, (currentDom) => currentDom.style.backgroundColor = color);
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


async function cancelBuyOrder(thisVal, extensionSetings, sessionId, item_description) {
    let { item_id, asset_description } = item_description;
    if (asset_description && item_id !== null && item_id !== undefined) {
        if (Object.entries(asset_description).length > 0) {
            let { appid, market_hash_name } = asset_description;
            let myListings = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/mylistings/?norender=1', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
            await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
            let orderListArr = myListings.buy_orders;
            if (appid !== null && appid !== undefined && market_hash_name) {
                let itemInfo = orderListArr.filter(item => item.hash_name === market_hash_name && item.appid === appid)[0];
                let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
                if (Object.entries(itemInfo).length === 8) {
                    let orderId = itemInfo.buy_orderid;
                    if (orderId !== null && sessionId !== null) {
                        let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
                        let url = "https://steamcommunity.com/market/cancelbuyorder/";
                        let serverResponse = await globalThis.httpPostErrorPause(url, params);
                        htmlResponce.textContent = (serverResponse.success === 1) ? "Done cancel" : "Error cancel"; /* {success: 1} */
                    }
                } else {
                    htmlResponce.textContent = "Buy Order does not exist";
                }
            }
        }
    }

}

async function createBuyOrder(thisVal, extensionSetings, sessionId, item_description) {
    /* let item_id = thisVal.id.split('_')[1]; */
    let { item_id, asset_description } = item_description;
    if (asset_description && item_id !== null && item_id !== undefined) {
        if (Object.entries(asset_description).length > 0) {
            let { appid, market_hash_name } = asset_description;
            market_hash_name = fixedEncodeURIComponent(market_hash_name);
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
            if (appid !== null && appid !== undefined && market_hash_name) {
                let params = `sessionid=${sessionId}&currency=1&appid=${appid}&market_hash_name=${market_hash_name}&price_total=${Math.round(inputPrice * 100 * itemCount)}&quantity=${itemCount}&billing_state=&save_my_address=0`;
                let url = "https://steamcommunity.com/market/createbuyorder/";
                let serverResponse = await globalThis.httpPostErrorPause(url, params);
                let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
                if (serverResponse.success === 1) {
                    htmlResponce.textContent = "Order created";

                    let steamItemBlock = document.getElementsByClassName(`order_block_${item_id}`)[0].nextSibling;
                    //<div class="market_listing_row market_recent_listing_row" id="mybuyorder_4157921926" style="background-color: rgb(96, 55, 62);"></div>
                    myNextBuyPrice = NextPrice((inputPrice * 100).toFixed(), "real");
                    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + extensionSetings.selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));

                    let priceHistory = await getItemHistory(appid, market_hash_name, extensionSetings.selectLang);

                    steamItemBlock.firstElementChild.dataset.scanned = "update";
                    displayProfitable(steamItemBlock, priceJSON, priceHistory, item_description, myNextBuyPrice, itemCount, extensionSetings);
                }
                htmlResponce.textContent = (serverResponse.success === 29) ? serverResponse.message : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
            }
        }
    }

}