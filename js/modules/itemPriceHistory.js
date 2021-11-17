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
        
    return{countSell, countSellSevenDays};
}


