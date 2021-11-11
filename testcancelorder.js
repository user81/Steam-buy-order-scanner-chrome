sessionid=a642c74c6025eb3a76ed37ea&buy_orderid=3844265409


globalThis.httpPostErrorPause = async function() {
    let httpPostRequest = new Promise(function (resolve, reject) {
        var xhrCancelBuyOrder = new XMLHttpRequest();
        var url = "https://steamcommunity.com/market/createbuyorder/";
        var params = `sessionid=${g_sessionID}&currency=1&appid=753&market_hash_name=326670-Elf Waywatcher (Foil)&price_total=${Math.round(0.03 * 100 * 2)}&quantity=2&billing_state=&save_my_address=0`;
        xhrCancelBuyOrder.open('POST', url, true);
        xhrCancelBuyOrder.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhrCancelBuyOrder.onreadystatechange = function () {
            if(xhrCancelBuyOrder.readyState == 4 && xhrCancelBuyOrder.status == 200) {
                console.log(xhrCancelBuyOrder.responseText);
                return resolve(this.responseText);
            } 
        };
        xhrCancelBuyOrder.onerror = function () {
            reject(new Error("Network Error"));
        };
        xhrCancelBuyOrder.send(params);
    });
};
let val = await globalThis.httpPostErrorPause();
console.log (val);

globalThis.httpPostErrorPause = async function() {
let httpGetRequest = new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    var url = "https://steamcommunity.com/market/createbuyorder/";
    var params = `sessionid=031ce07a1fb035b43609dd6b&currency=1&appid=753&market_hash_name=326670-Elf Waywatcher (Foil)&price_total=${Math.round(0.03 * 100 * 2)}&quantity=2&billing_state=&save_my_address=0`;
    xhrCancelBuyOrder.open('POST', url, true);
    xhrCancelBuyOrder.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
            resolve(this.response);
    };
    xhr.onerror = function () {
        reject(new Error("Network Error"));
    };
    xhrCancelBuyOrder.send(params);
});
}
console.log (globalThis.httpPostErrorPause());

globalThis.httpErrorPause = async function(url, attempts = 8, scanIntervalSET = 6000, errorPauseSET = 5) {
    let httpGetRequest = new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve(this.response);
            } else {
                var httpError = new Error(this.statusText);
                httpError.code = this.status;
                reject(httpError);
            }
        };
        xhr.onerror = function () {
            reject(new Error("Network Error"));
        };
        xhr.send();
    });

    return await httpGetRequest.catch(delayRequestGet(url, attempts, scanIntervalSET, errorPauseSET));
};










globalThis.httpPostErrorPause = async function() {
    return new Promise(function (resolve, reject) {
        var xhrCancelBuyOrder = new XMLHttpRequest();
        var url = "https://steamcommunity.com/market/createbuyorder/";
        var params = `sessionid=${g_sessionID}&currency=1&appid=753&market_hash_name=326670-Elf Waywatcher (Foil)&price_total=${Math.round(0.03 * 100 * 2)}&quantity=2&billing_state=&save_my_address=0`;
        xhrCancelBuyOrder.open('POST', url, true);
        xhrCancelBuyOrder.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhrCancelBuyOrder.onreadystatechange = function () {
            if(xhrCancelBuyOrder.readyState == 4 && xhrCancelBuyOrder.status == 200) {
                console.log(xhrCancelBuyOrder.responseText);
                return resolve(this.responseText);
            } 
        };
        xhrCancelBuyOrder.onerror = function () {
            reject(new Error("Network Error"));
        };
        xhrCancelBuyOrder.send(params);
    });
};


let val = await globalThis.httpPostErrorPause();