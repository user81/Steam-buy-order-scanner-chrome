/**
 * Расчёт прибыли
 * @param {Object} priceJSON // таблица цен
 * @param {Number} coefficient // коэфицент прибыли
 * @returns {Object}
 */
function listProfitCalculation(priceJSON, coefficient = 0.35) {
  let currentDiv = document.getElementById("largeiteminfo_item_descriptors");
  ProfitableList = { actualProfit: "Nan", coefPrice: "Nan", realPrice: "Nan" };
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
