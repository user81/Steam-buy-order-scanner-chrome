/**
 * расчёт истории цен
 */
async function getItemHistory(appId, hashName, selectLang) {
    await new Promise(done => timer = setTimeout(() => done(), + 1000 + Math.floor(Math.random() * 500)));
    let historyPriceJSON = JSON.parse(await globalThis.httpErrorPause(`https://steamcommunity.com/market/pricehistory/?country=${selectLang}&currency=1&appid=${appId}&market_hash_name=${hashName}`));
    let countSell = 0;
    let countSellSevenDays = 0;

    let format = (d, a = d.toString().split` `, h = d.getMinutes() >= 30 ? d.getHours() + 1 : d.getHours()) => a[1] + " " + a[2] + " " + a[3] + " " + h + ": +0";

        let lastDaysMs =Date.parse(new Date) - (1000 * 60 * 60 * 24 * 1);
        let lastSevenDaysMs =Date.parse(new Date) - (1000 * 60 * 60 * 24 * 7);
        for (var key in historyPriceJSON.prices) {
            if (Date.parse(historyPriceJSON.prices[key][0]) > lastDaysMs) {
                countSell += +historyPriceJSON.prices[key][2];
            }
            if (Date.parse(historyPriceJSON.prices[key][0]) > lastSevenDaysMs) {
                countSellSevenDays += +historyPriceJSON.prices[key][2];
            }
        }
        
    return{countSell, countSellSevenDays, historyPriceJSON};
}

/**
 * форматирование ссылок
 */
function fixedEncodeURIComponent(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
		return '%' + c.charCodeAt(0).toString(16);
	});
}

/**
 * ращёт чистой цены и следующей цены
 */

function calculatepriceWithoutFee(nAmount) { 
    let feeInfo = CalculateFeeAmount(nAmount, g_rgWalletInfo['wallet_publisher_fee_percent_default']);
    nAmount = nAmount - feeInfo.fees;
    return v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));// цена без комиссии $0.11
}

function freePrice(priceValue = 0) {
    let inputValue = GetPriceValueAsInt(getNumber(`${priceValue}`));
    let nAmount = inputValue;
    if (inputValue > 0 && nAmount == parseInt(nAmount)) {
        return calculatepriceWithoutFee(nAmount); //calculatepriceWithoutFee -> $0.11
    }
    return 0;
}

function NextPrice(lowestSellOrder, tupe = "higest") {
    let nextPriceWithoutFee;
    let myNextPrice;
    if (lowestSellOrder === null) {
        nextPriceWithoutFee = 0.01;
        myNextPrice = 0.03;
        return {nextPriceWithoutFee, myNextPrice};
    }
    var inputValue = GetPriceValueAsInt(getNumber(`${lowestSellOrder/100}`));
    var nAmount = inputValue;
    if (inputValue > 0 && nAmount == parseInt(nAmount)) {
        priceWithoutFee = getNumber(calculatepriceWithoutFee(nAmount));//calculatepriceWithoutFee -> $0.11
        nextPriceWithoutFee = priceWithoutFee; //nextPriceWithoutFee прибыль которая длжна меняться
        while (nextPriceWithoutFee == priceWithoutFee) {
            if (tupe === "higest")  ++inputValue;
            if (tupe === "real")  --inputValue;  
            nextPriceWithoutFee = getNumber(calculatepriceWithoutFee(inputValue));//calculatepriceWithoutFee -> $0.11
            myNextPrice = getNumber(v_currencyformat(inputValue, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        }
        if (tupe === "real") {
            nextPriceWithoutFee = getNumber(calculatepriceWithoutFee(inputValue + 1));//calculatepriceWithoutFee -> $0.11
            myNextPrice = getNumber(v_currencyformat(+inputValue + 1, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        }
    }
    return {nextPriceWithoutFee, myNextPrice};
}
