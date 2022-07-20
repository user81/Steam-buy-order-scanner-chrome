/**
 * Элементы для стилизации для стариницы market/search
 */

/**
 * Цена без комиссии
 * @param {HTMLElement} spanCountBlock // Dom элемент карточки предмета который мы будем изменять
 * @param {Object} pricesProfit // прибыль {actualProfit: "...." - прибыль в данный момент, coefPrice: "...." - прибыль для коэфицента, realPrice: "...." цена без комисии}
 */
function realPrice(spanPriceBlock, pricesProfit) {
  let realPriceHTML = `<span class="real_price">(${pricesProfit.realPrice})</span>`;
  spanPriceBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(realPriceHTML));
}

/**
* Таблица продаж
* @param {HTMLElement} spanCountBlock // Dom элемент карточки предмета который мы будем изменять
* @param {Object} priceJSON // таблица цен
*/
function listingSellTab(divItemBlock, priceJSON) {
  let myListingSellTabHTML = `<span class="market_table_value market_table_price_json_sell">${priceJSON.sell_order_table}</span>`;
  let listingSell = divItemBlock.getElementsByClassName("market_my_listing_sell_tab")[0];
  listingSell.insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingSellTabHTML));
}

/**
* Таблица покупок
* @param {HTMLElement} spanCountBlock // Dom элемент карточки предмета который мы будем изменять
* @param {Object} priceJSON // таблица цен
*/
function listingBuyTab(divItemBlock, priceJSON) {
  let myListingBuyTabHTML = `<span class="market_table_value market_table_price_json_buy">${priceJSON.buy_order_table}</span>`;
  divItemBlock.getElementsByClassName("market_my_listing_buy_tab")[0].insertAdjacentHTML('beforeend', DOMPurify.sanitize(myListingBuyTabHTML));
}

/**
* Изменение ордера и вывод историии
* @param {Object} item_description // данные предмета {item_id - уникальный идентификатор, asset_description - JSON данные предмета}
* @param {HTMLElement} myListingBuyUpdateDom // Dom элемент карточки предмета перед которы мы будем добавлять этот блок
* @param {Object} myNextBuyPrice // следующая цена и цена без комисии
* @param {Number} quantityWant // количество по умолчанию для создания ордера на покупку
* @param {object} extensionSetings // обект настроек для запроса к серверу
* @param {Object} priceJSON // таблица цен
* @param {Array} itemPriceHistory массив истории цен
* @param {Text} color цвет заливки блока
* @param {Text} sessionId текущая сесия страницы
*/

function itemOrderChange(item_description, myListingBuyUpdateDom, myNextBuyPrice, quantityWant, extensionSetings, priceJSON, itemPriceHistory, sessionId) {

  let { item_id } = item_description;
  let myListingBuyUpdateHTML = `
  <span class="market_search_sidebar_contents change_price_search  market_table_value change_price_block order_block_${item_id}"
  style ="display: block; height: 50px;"
  >
      <span id="myItemRealBuyPrice${item_id}">${myNextBuyPrice.nextPriceWithoutFee}</span>
      <span id="myItemNextBuyPrice${item_id}">${myNextBuyPrice.myNextPrice}</span>
      <input type="number" step="0.01" id="myItemBuyPrice${item_id}" class="change_price_input">
      <input type="number" id="myItemQuality${item_id}" class="change_price_input">
      <button id="cancelBuyOrder_${item_id}" class = "market_searchedForTerm"> ⦸ </button>
      <button id="createBuyOrder_${item_id}" class = "market_searchedForTerm"> ⨭ </button>
      <button id="showHistory_${item_id}" class = "market_searchedForTerm"> ${getLocalizeText("showHistoryButton", "Show history")} </button>
      <button id="removeHistory_${item_id}" class = "market_searchedForTerm"> Remove </button>
      <div class ="orderMessageBlock">
      <div id="responceServerRequestBuyOrder_${item_id}"></div>
      </div>
      
  </span>`;
  myListingBuyUpdateDom.insertAdjacentHTML('beforebegin', DOMPurify.sanitize(myListingBuyUpdateHTML));
  let buttonCancelBuy = document.getElementById(`cancelBuyOrder_${item_id}`);
  let buttonCreateBuy = document.getElementById(`createBuyOrder_${item_id}`);
  let buttonshowHistory = document.getElementById(`showHistory_${item_id}`);
  let buttonremoveHistory = document.getElementById(`removeHistory_${item_id}`);
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
  buttonshowHistory.addEventListener("click", (event) => {
    if (itemPriceHistory !== undefined && itemPriceHistory.length > 1) {
      DomRemove(document.getElementById(`chart_${item_id}`));
      historyChart(myListingBuyUpdateDom.getElementsByClassName("market_listing_item_name_block")[0], item_id, "chart-search");
      showHistoryChart(itemPriceHistory, item_id);
    }
  });

  buttonremoveHistory.addEventListener("click", (event) => DomRemove(document.getElementById(`chart_${item_id}`)));

  buttonCancelBuy.addEventListener("click", (event) => { cancelBuyOrder(extensionSetings, sessionId, item_description); });
}

/**
 * Блок который отображает прибыль и сколько продано
 * @param {HTMLElement} itemDescriptionDiv // Dom элемент карточки предмета который мы будем изменять
 * @param {Object} itemProfit // прибыль {actualProfit: "...." - прибыль в данный момент, coefPrice: "...." - прибыль для коэфицента, realPrice: "...." цена без комисии}
 * @param {Object} priceHistory // история продаж и Json данные истории цен
 * @param {string} item_id // уникальный id предмета
 * @param {string} stuleClass // класс для стилизации
 */
function displayProfitableBlock(itemDescriptionDiv, itemProfit, priceHistory, item_id, stuleClass = '') {
  let { countSell, countSellSevenDays } = priceHistory;
  let { actualProfit, coefPrice, realPrice } = itemProfit;
  if (realPrice !== undefined && actualProfit !== undefined && coefPrice !== undefined && itemDescriptionDiv !== null) {
    let itemProfitInfo = `
      <div class="market_my_card_${item_id} ${stuleClass}">
          <div class="profitableElement">
              <label class="help" title="${getLocalizeText("profitAtTheMomentDescription", "Profit now:")}">⬆</label>
              <span> ${actualProfit}</span>
          </div>
          <div class="profitableElement">
              <label class="help" title="${getLocalizeText("coefficientPriceAtTheMomentDescription", "Required profit:")}">⬆%</label>
              <span>${coefPrice}</span>
          </div>
          <div class="profitableElement">
              <label class="help" title="${getLocalizeText("salesInOneDay", "Sold out in 1 days:")}">🗓1</label>
              <span>${countSell}</span>
          </div>
          <div class="profitableElement">
              <label class="help" title="${getLocalizeText("salesInSevenDays", "Sold out in 7 days:")}">🗓7</label>
              <span>${countSellSevenDays}</span>
          </div>
      </div>
      `;
    itemDescriptionDiv.insertAdjacentHTML('beforeend', DOMPurify.sanitize(itemProfitInfo));
  }
}

function displayDuyOrderBlock (imgIcon, item_id) {
  let itemOrderInfo = `
  <div class="market_my_buy_order${item_id}">0/0</div>`;
  imgIcon.insertAdjacentHTML('afterend', DOMPurify.sanitize(itemOrderInfo));

}