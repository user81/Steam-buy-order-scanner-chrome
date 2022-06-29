changeSearchSize();
var g_rgWalletInfo = {
    wallet_fee: 1,
    wallet_fee_base: 0,
    wallet_fee_minimum: 1,
    wallet_fee_percent: 0.05,
    wallet_publisher_fee_percent_default: 0.10,
    wallet_currency: 1
};

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
        if (window.history && window.history.pushState) {
            window.onpopstate = event => getPageSizeInSearch(5, data.quantity, data.coefficient, data.selectLang, data.scanIntervalSET, data.errorPauseSET, SessionIdVal());
        }

    }
});

async function displaySearchRunScan(coefficient) {
    let divRunScan = document.getElementById("market_search");
    if (document.getElementById("runSearchScan") == null) {
        let scanerMarketSearchHTML = `
        <div>
            <span class="market_listing_item_name">
                Price From
                <input type="number" id="priceFromVal" step="0.01">
            </span>
            <span class="market_listing_item_name">
            Price To
            <input type="number" id="priceToVal" step="0.01">
        </span>
            <span class="market_listing_item_name">
                Min Count
                <input type="number" id="minCountVal">
            </span>
            <span class="market_listing_item_name">
                Min Sell
                <input type="number" id="minSellVal">
            </span>
            <span class="market_listing_item_name">
                Min Profit
                <input type="number" id="minProfitVal" value ="">
            </span>
            <br>
            <br>
            <span class="market_listing_item_name">
                only Profitable
                <input type="checkbox" class="input-value-checkbox" id="onlyProfitable">
            </span>

            <div class="SearchButton">
            <button class="market_search_advanced_button" id="reloadScan" disabled>🗘</button>
            <button class="market_search_advanced_button" id="runSearchScan" disabled>Run Scan</button>
            <button class="market_search_advanced_button" id="runLoadOrder" disabled>Run Load</button>
            </div>

            <div class="selectBlock">
            <div class="multiselect">
                <div class="selectBox" id="selectPage">
                    <select class="selectLang" id="selectOptionVal" style="color: rgb(255, 255, 255);">
                        <option>Pages</option>
                    </select>
                    <div class="overSelect"></div>
                </div>
                <div id="checkboxes" style="display: none;">

                </div>
            </div>

            </div>

            <div class="myProgressLine" id="myProgresLoading">
                <div class ="myBarsLine"></div>
                <div class ="myBarsVal"></div>
                <span class ="percentageOfCompletion" style="display: none">0</span>
            </div>

        </div>
        `;
        divRunScan.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(scanerMarketSearchHTML));
        //линия загрузки lineBarRender
        lineBarRender();
        let textActive = "#d9c859"
        let textDefault = "#fff"
        parentElementChaneColor(textActive, textDefault, document.getElementsByClassName("input-value-checkbox"));
    }
}
let StopScan = false;

function ordersReload() {
    let pageSize = 0;
    let pageFragmentUrl = window.location.href.split('#',)[1];
    if (pageFragmentUrl !== undefined) {
        pageSize = pageFragmentUrl.split('_',)[0].replace(/\D/g, '');
    }

    changeSearchSize(pageSize);
    StopScan = true;
}

function showCheckboxes(expanded) {
    let checkboxes = document.getElementById("checkboxes");
    let selectOptionVal = document.getElementById("selectOptionVal");
    let textActive = "#d9c859"
    let textDefault = "#fff"
    console.log(expanded);
    if (!expanded) {
        console.log(checkboxes);
        console.log(selectOptionVal);
        checkboxes.style.display = "block";
        selectOptionVal.style.color = textActive;
        expanded = true;
        let checkboxList = document.getElementsByClassName("select-input-value-checkbox");
        if (checkboxList.length !== 0) {
            parentElementChaneColor(textActive, textDefault, checkboxList);
        }
    } else {
        selectOptionVal.style.color = textDefault;
        checkboxes.style.display = "none";
        expanded = false;
    }
    return expanded;
}

async function getPageSizeInSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId) {
    let orderListBuyJSONArr;
    let expanded = false;
    document.getElementById("reloadScan").addEventListener("click", () => { ordersReload(); });
    document.getElementById("selectPage").addEventListener("click", () => { expanded = showCheckboxes(expanded); });
    document.getElementById("runSearchScan").addEventListener("click", () => {
        marketSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId); StopScan = false;
    });

    /**
     * https://steamcommunity.com/market/search?select=value2&select=value2&select=value2&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=tag_weapon_knife_flip&appid=730&q=#p2_popular_desc
     * https://steamcommunity.com/market/search?select=0&select=100&appid=730&q=Dreams#p1_default_desc
     * https://steamcommunity.com/market/search?select=0&select=100&select=100&appid=730&q=#p1_popular_desc
     */

    let searchUrl = window.location.href;

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

    async function ServerRequestAddSearchResults(searchUrl, start = 0, count = 100) {
        let marketSeachInfoNorender;
        let ArraySortingAppidObject;
        let searchUrlСategory = searchUrl.match(/category(.*)/);
        if (searchUrlСategory !== null) {
            ArraySortingAppidObject = getArraySortingAppid(searchUrlСategory);
            if (ArraySortingAppidObject) {

                let categoryVal;
                /* https://steamcommunity.com/market/search?q=&category_730_ItemSet%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2&appid=730#p2_popular_desc
                жадный category_730_ItemSet%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2 */
                let categoryStringAnd = searchUrlСategory.input.match(/category.*(?=\&)/g);
                let categoryStringHashtag = searchUrlСategory.input.match(/category.*(?=\#)/g);
                if (categoryStringAnd) {
                    categoryVal = categoryStringAnd.join('&');
                } else if (categoryStringHashtag) {
                    // для ссылок https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_416450#p1_popular_desc
                    // жадный category_753_Game[]=tag_app_416450
                    categoryVal = categoryStringHashtag.join('&');
                }
                if (categoryVal && ArraySortingAppidObject.appId) {
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                    marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&${categoryVal}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                    await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                }
            }
        } else {
            // обрабатываем c appid https://steamcommunity.com/market/search?appid=730&q=ak#p1_default_desc 
            let searchUrlFragment = searchUrl.match(/search\?(.*)/);
            let ArraySortingAppidObject = getArraySortingAppid(searchUrlFragment);
            if (ArraySortingAppidObject && ArraySortingAppidObject.appId) {
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&appid=${ArraySortingAppidObject.appId}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
            // обрабатываем без appid https://steamcommunity.com/market/search?q=ak#p1_default_desc
            if (ArraySortingAppidObject && ArraySortingAppidObject.appId === null) {
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
                marketSeachInfoNorender = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/search/render/?query=${queryItem.value}&start=${start}&count=100&search_descriptions=0&sort_column=${ArraySortingAppidObject.arraySortingVal[1]}&sort_dir=${ArraySortingAppidObject.arraySortingVal[2]}&norender=1`, CountRequesrs, scanIntervalSET, errorPauseSET));
                await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            }
        }
        return { marketSeachInfoNorender };
    }

    let queryItem = document.getElementById("findItemsSearchBox");
    if (queryItem !== null) {
        let { marketSeachInfoNorender } = await ServerRequestAddSearchResults(searchUrl);
        const pageSize = Math.ceil(marketSeachInfoNorender.total_count / 100);

        selectPageCheckbox(pageSize, htmlItemList(marketSeachInfoNorender));
        orderListBuyJSONArr = marketSeachInfoNorender.results;

    }

    let runLoadOrder = document.getElementById("runLoadOrder");

    runLoadOrder.onclick = async function () {
        document.getElementById("runSearchScan").disabled = true;
        document.getElementById("runLoadOrder").disabled = true;
        let checkboxBlock = document.getElementsByClassName("select-input-value-checkbox");
        let pagesArr = [];
        if (checkboxBlock.length !== 0) {
            Array.prototype.map.call(checkboxBlock, (currentDom) => {
                if (currentDom.checked === true && !isNaN(currentDom.value) && !currentDom.disabled) {
                    currentDom.disabled = true;
                    pagesArr.push(currentDom.value);
                }
            });
        }

        let loadinCount = 0;
        for (let loadinProgres = 0; loadinProgres < pagesArr.length; loadinProgres++) {
            await new Promise(done => timer = setTimeout(() => done(), +scanIntervalSET + Math.floor(Math.random() * 500)));
            let { marketSeachInfoNorender } = await ServerRequestAddSearchResults(searchUrl, pagesArr[loadinProgres]);

            let myCustomMarketTableHTML = document.getElementById("searchResultsRows");
            myCustomMarketTableHTML.insertAdjacentHTML('beforeend', DOMPurify.sanitize(htmlItemList(marketSeachInfoNorender)));
            orderListBuyJSONArr = [...orderListBuyJSONArr, ...marketSeachInfoNorender.results];

            // линия загрузки
            changeSizeLineBar("myProgresLoading", ++loadinCount, pagesArr.length, 'p');

        }
        document.getElementById("runSearchScan").disabled = false;
        document.getElementById("runLoadOrder").disabled = false;
    }

    document.getElementById("reloadScan").disabled = false;
    document.getElementById("runSearchScan").disabled = false;
    document.getElementById("runLoadOrder").disabled = false;

    /*    https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_416450#p1_popular_desc
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&category_730_ItemSet%5B%5D=any&category_730_ProPlayer%5B%5D=any&category_730_StickerCapsule%5B%5D=any&category_730_TournamentTeam%5B%5D=any&category_730_Weapon%5B%5D=any&category_730_Exterior%5B%5D=tag_WearCategory2
    https://steamcommunity.com/market/search/render/?query=P90&start=0&count=100&search_descriptions=0&sort_column=default&sort_dir=desc&appid=730&query=usp&appid=730&query=usp
    
  
  https://steamcommunity.com/market/search/render/?query=&start=0&count=100&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=753&category_753_Game%5B%5D=tag_app_416450
  https://steamcommunity.com/market/search/render/?query=&start=100&count=100&search_descriptions=0&sort_column=popular&sort_dir=desc&appid=753&category_753_Game[]=tag_app_416450
  
    !!!нумерация не работает
    https://steamcommunity.com/market/search?q=%D0%A1%D1%83%D0%B2%D0%B5%D0%BD%D0%B8%D1%80%D0%BD%D1%8B%D0%B9+%D0%BD%D0%B0%D0%B1%D0%BE%D1%80#p1_default_desc
    https://steamcommunity.com/market/search?appid=730#p1_popular_desc&norender=1
    */

    async function marketSearch(CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET, sessionId) {
        let numberOfRepetitions = 10;
        let marketItems;
        let RereadTheAmountItems = async function (numberOfRepetitions) {
            document.getElementById("runSearchScan").disabled = true;
            document.getElementById("runLoadOrder").disabled = true;
            marketItems = Array.from(document.getElementsByClassName("market_recent_listing_row"));
            if (numberOfRepetitions <= 0) {
                await waitTime((+errorPauseSET + Math.floor(Math.random() * 5)) * 60000);
                return RereadTheAmountItems(numberOfRepetitions = 10);
            }
    
            if (marketItems.length > 0) {
                orderListArr = await getMyBuyListing({ CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET }); // список моих ордеров на покупку

                // Общее количество запросов которые необходимо сделать
                let marketItemsAllCount = 0;
                let countRequest = 0;
                for (let index = 0; index < marketItems.length; index++) {
                    if (marketItems[index].dataset.scanned === undefined) {
                        marketItemsAllCount++;
                    }
                }
    
                for (let index = 0; index < marketItems.length; index++) {
                    if (StopScan) return;
    
                    let assetJSON;
                    console.log(orderListBuyJSONArr);
                    console.log(marketItems[index].dataset.scanned);
                    if (marketItems[index].dataset.scanned === undefined) {
    
    
                        let blockNames = ["Buy_tab", "Sell_tab"];
                        for (const key in blockNames) {
                            countBlock = marketItems[index].getElementsByClassName(" market_listing_price_listings_block")[0];
                            let myItemBlocksHTML = `<div class="market_listing_right_cell market_listing_my_price market_my_listing_${blockNames[key].toLowerCase()}"></div>`;
                            countBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(myItemBlocksHTML));
                        }
    
                        let orderHref = marketItems[index].getElementsByClassName("market_listing_row_link")[0].href;
                        let orderPrice = +marketItems[index].getElementsByClassName('normal_price')[0].innerText.match(/([0-9]*\.[0-9]+|[0-9]+)/g);
                        let orderCount = +marketItems[index].getElementsByClassName('market_listing_num_listings_qty')[0].innerText.replace(/[^+\d]/g, '');
                        var appId = marketItems[index].dataset.appid;
                        /* var aId = marketItems[index].firstElementChild.id; */
                        var hashName = fixedEncodeURIComponent(marketItems[index].dataset.hashName);
                        let priceFromVal = document.getElementById("priceFromVal").value || 0;
                        let priceToVal = document.getElementById("priceToVal").value || Infinity;
                        let minCountVal = document.getElementById("minCountVal").value || -1;
                        let minProfitVal = document.getElementById("minProfitVal").value || -Infinity;
                        let minSellVal = document.getElementById("minSellVal").value || 0;
                        let onlyProfitable = document.getElementById("onlyProfitable").checked || false;
    
                        assetJSON = orderListBuyJSONArr.filter(item => item.asset_description.market_hash_name === marketItems[index].dataset.hashName && `${item.asset_description.appid}` === appId)[0];
                        let {asset_description} =assetJSON;
                        if (asset_description === undefined) return;
                        if (Object.entries(asset_description).length === 0) return;
                        
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
    
                            if (asset_description) {
                                console.log(asset_description);
                                existMyBuyOrder({ item_id, asset_description }, marketItems[index], orderListArr);
                                await displayProfitable(marketItems[index], priceJSON, priceHistory, { item_id, asset_description }, myNextBuyPrice, quantity, { CountRequesrs, quantity, coefficient, selectLang, scanIntervalSET, errorPauseSET });
                            }
    
                        }
                        // линия загрузки
                        changeSizeLineBar("myProgresLoading", ++countRequest, marketItemsAllCount, 'req');
                    }
                }
                document.getElementById("runSearchScan").disabled = false;
                document.getElementById("runLoadOrder").disabled = false;
                return;
            }
            ordersReload();
            await waitTime(5000 + scanIntervalSET + Math.floor(Math.random() * 50));
            marketItems = Array.from(document.getElementsByClassName("market_listing_row_link"));
    
            document.getElementById("runSearchScan").disabled = false;
            document.getElementById("runLoadOrder").disabled = false;
            return RereadTheAmountItems(numberOfRepetitions - 1);
        }
        RereadTheAmountItems(numberOfRepetitions);
    
    }    

}

function htmlItemList(marketSeachInfoNorender) {
    console.log(marketSeachInfoNorender);
    let { results } = marketSeachInfoNorender;
    console.log(results);
    if (results && results.length > 0) {
        let FullBlockHtmlText = results.map(itemJson => {
            if (Object.entries(itemJson).length > 0) {
                let blockHtmlText = `
                  <div data-hash-name="${itemJson.hash_name}" data-appid="${itemJson.asset_description.appid}" id="result_${itemJson.index}"
                  class="market_listing_row market_recent_listing_row market_listing_searchresult">
                  <img alt="" class="market_listing_item_img" style="border-color:  ${itemJson.name_color || 'white'};"
                    srcset="https://community.cloudflare.steamstatic.com/economy/image/${itemJson.asset_description.icon_url}/62fx62f 1x, https://community.cloudflare.steamstatic.com/economy/image/${itemJson.asset_description.icon_url}/62fx62fdpx2x 2x"
                    src="https://community.cloudflare.steamstatic.com/economy/image/${itemJson.asset_description.icon_url}/62fx62f"
                    id="result_0_image">
                  <div class="market_listing_price_listings_block">
                    <div class="market_listing_right_cell market_listing_num_listings">
                      <span class="market_table_value">
                        <span data-qty="${itemJson.sell_listings}" class="market_listing_num_listings_qty">${itemJson.sell_listings}</span>
                      </span>
                    </div>
                    <div class="market_listing_right_cell market_listing_their_price">
                      <span class="market_table_value normal_price">
                        От<br>
                        <span data-currency="1" data-price="${itemJson.sell_price}" class="normal_price">${itemJson.sale_price_text}</span>
                      </span>
                        
                    </div>
                  </div>
                        
                  <div class="market_listing_item_name_block" style="background-color: ${itemJson.background_color || 'none'};">
                    <a id="resultlink_0"
                    href="https://steamcommunity.com/market/listings/${itemJson.asset_description.appid}/${fixedEncodeURIComponent(itemJson.asset_description.market_hash_name)}"
                    class="market_listing_row_link">
                    <span style="color: ${itemJson.name_color || 'white'};" class="market_listing_item_name" id="result_0_name">${itemJson.name}</span>
                    </a>
                    <br>
                    <span class="market_listing_game_name">${itemJson.app_name}</span>
                  </div>
                </div>`;
                return blockHtmlText;
            }
        }).join('');
        return FullBlockHtmlText;
    }
}


/**
 * Выводим список чекбоксов и обновляем список результатов поиска из полученного запроса
 * @param {number} pageSize количество стриниц
 * @param {text} marketSeachList HTML строка. Списрк всех товаров. 
 */
function selectPageCheckbox(pageSize, marketSeachList) {
    DomRemove(document.getElementsByClassName("checkboxes_pages")[0]);
    let checkBoxBlock = document.getElementById("checkboxes");
    for (let index = 0; index < pageSize; index++) {
        checkBoxBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`  
        <label class ="checkboxes_pages" for="checkboxes_page_${+index + 1}">
            <input type="checkbox" id="checkboxes_page_${+index + 1}" value="${(+index) * 100}" class="select-input-value-checkbox" />${+index + 1}
        </label>`));
    }

    let myCustomMarketTableHTML = document.getElementById("searchResultsRows");
    myCustomMarketTableHTML.textContent = '';
    myCustomMarketTableHTML.innerHTML = DOMPurify.sanitize(marketSeachList);
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


async function getMyBuyListing(extensionSetings) {
    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
    let myListings = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/mylistings/?norender=1', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));
    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
    return myListings.buy_orders;
}

function existMyBuyOrder(item_description, divItemBlock, orderListArr) {
    let { item_id, asset_description } = item_description;
    if (asset_description && item_id !== null && item_id !== undefined) {
        if (Object.entries(asset_description).length > 0) {
            let { appid, market_hash_name } = asset_description;

            if (appid !== null && appid !== undefined && market_hash_name) {
                let itemInfo = orderListArr.filter(item => item.hash_name === market_hash_name && item.appid === appid)[0];
                console.log(market_hash_name, appid);
                console.log(itemInfo);
                if (itemInfo) {
                    if (Object.entries(itemInfo).length === 8) {
                        divItemBlock.style.borderLeft = "10px solid #136661";
                    }
                }
            }
        }
    }
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
    itemOrderChange(item_description, divItemBlock, myNextBuyPrice, quantity, extensionSetings, priceJSON, minMaxPricePerDayVal, setSearchColor(pricesProfit), sessionId);

    divItemBlock.style.backgroundColor = setSearchColor(pricesProfit);
    divItemBlock.dataset.scanned = "true";
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
        <div class ="orderMessageBlock">
        <div id="responceServerRequestBuyOrder_${item_id}"></div>
        </div>
        
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

function setSearchColor(ProfitableList) {
    if (+ProfitableList.actualProfit > +ProfitableList.coefPrice) return "#09553c";
    if (+ProfitableList.actualProfit > 0.1 && +ProfitableList.actualProfit <= +ProfitableList.coefPrice) return "#61632b";
    if (+ProfitableList.actualProfit <= 0.1) return "#602F38";
}


async function cancelBuyOrder(thisVal, extensionSetings, sessionId, item_description) {
    let { item_id, asset_description } = item_description;
    if (asset_description && item_id !== null && item_id !== undefined) {
        if (Object.entries(asset_description).length > 0) {
            let { appid, market_hash_name } = asset_description;
            let orderListArr = await getMyBuyListing(extensionSetings);
            if (appid !== null && appid !== undefined && market_hash_name) {
                let itemInfo = orderListArr.filter(item => item.hash_name === market_hash_name && item.appid === appid)[0];
                let htmlResponce = document.getElementById(`responceServerRequestBuyOrder_${item_id}`);
                if (itemInfo) {
                    if (Object.entries(itemInfo).length === 8) {
                        let orderId = itemInfo.buy_orderid;
                        if (orderId !== null && sessionId !== null) {
                            let params = `sessionid=${sessionId}&buy_orderid=${orderId}`;
                            let url = "https://steamcommunity.com/market/cancelbuyorder/";
                            let serverResponse = await globalThis.httpPostErrorPause(url, params);
                            let steamItemBlock = document.getElementsByClassName(`order_block_${item_id}`)[0].nextSibling;
                            steamItemBlock.style.borderLeft = (serverResponse.success === 1) ? "none" : "10px solid #136661";
                            htmlResponce.textContent = (serverResponse.success === 1) ? "Done cancel" : "Error cancel"; /* {success: 1} */
                        }
                    } else {
                        htmlResponce.textContent = "Buy Order does not exist";
                    }
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
                    steamItemBlock.style.borderLeft = "10px solid #136661";
                    //<div class="market_listing_row market_recent_listing_row" id="mybuyorder_4157921926" style="background-color: rgb(96, 55, 62);"></div>
                    myNextBuyPrice = NextPrice((inputPrice * 100).toFixed(), "real");
                    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                    await new Promise(done => timer = setTimeout(() => done(), +extensionSetings.scanIntervalSET + Math.floor(Math.random() * 500)));
                    let priceJSON = JSON.parse(await globalThis.httpErrorPause('https://steamcommunity.com/market/itemordershistogram?country=RU&language=' + extensionSetings.selectLang + '&currency=1&item_nameid=' + item_id + '&two_factor=0', 5, extensionSetings.scanIntervalSET, extensionSetings.errorPauseSET));

                    let priceHistory = await getItemHistory(appid, market_hash_name, extensionSetings.selectLang);

                    displayProfitable(steamItemBlock, priceJSON, priceHistory, item_description, myNextBuyPrice, itemCount, extensionSetings);
                }
                htmlResponce.textContent = (serverResponse.success === 29) ? serverResponse.message : "Eroor"; // message: "У вас уже есть заказ на этот предмет. Вы должны либо ." success: 29{buy_orderid: "4562009753" success: 1}
            }
        }
    }

}