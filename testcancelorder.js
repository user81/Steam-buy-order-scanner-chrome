sessionid=a642c74c6025eb3a76ed37ea&buy_orderid=3844265409


globalThis.httpPostErrorPause = async function() {
    let httpPostRequest = new Promise(function (resolve, reject) {
        var xhrCancelBuyOrder = new XMLHttpRequest();
        var url = "https://steamcommunity.com/market/createbuyorder/";
        var params = `sessionid=a642c74c6025eb3a76ed37ea&currency=1&appid=753&market_hash_name=326670-Elf Waywatcher (Foil)&price_total=${Math.round(0.03 * 100 * 2)}&quantity=2&billing_state=&save_my_address=0`;
        xhrCancelBuyOrder.open('POST', url, true);
        xhrCancelBuyOrder.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhrCancelBuyOrder.onreadystatechange = function () {
/*             if(xhrCancelBuyOrder.readyState == 4 && xhrCancelBuyOrder.status == 200) {
                console.log(http.responseText);
            } */
        };
        xhrCancelBuyOrder.onerror = function () {
            reject(new Error("Network Error"));
        };
        xhrCancelBuyOrder.send(params);
    });
};
globalThis.httpPostErrorPause();