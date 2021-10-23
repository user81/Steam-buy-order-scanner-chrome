/**
 *  Steam buy order scanner - is browser extension which to keep your Steam buy Market orders profitable.
 *  https://github.com/user81/Steam-buy-order-scanner-chrome
 *  Copyright (C) 2021 Ermachenya Aleksandr
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var g_rgWalletInfo = {
    wallet_fee: 1,
    wallet_fee_base: 0,
    wallet_fee_minimum: 1,
    wallet_fee_percent: 0.05,
    wallet_publisher_fee_percent_default: 0.10,
    wallet_currency: 1
};

chrome.storage.local.get([
    "scanIntervalSET",
    "errorPauseSET",
    "coefficient",
    "selectLang",
], function (data) {
    GameInfo(data.coefficient, data.selectLang, 5, data.scanIntervalSET, data.errorPauseSET);
});

async function GameInfo(coefficient = 0.35, selectLang = "russian", CountRequesrs = 5, scanIntervalSET = 6000, errorPauseSET = 10000) {

    let gameUrlPage = window.location.href;
    let gameId = +gameUrlPage.split('app/').pop().split('/').shift();
    let gameJSON = JSON.parse(await globalThis.httpErrorPause(`https://store.steampowered.com/api/appdetails?appids=${gameId}`, CountRequesrs, scanIntervalSET, errorPauseSET));
    let arrAppId = [];

    if (gameJSON[+gameId].data.package_groups.length > 0) {
        let gameSubsJSON = gameJSON[+gameId].data.package_groups[0].subs;
        for (let index = 0; index < gameSubsJSON.length; index++) {
            arrAppId.push(+gameSubsJSON[index].packageid);
        }
    }
    if (arrAppId.length > 0) {
        for (let index = 0; index < arrAppId.length; index++) {
            if (typeof arrAppId[index] === 'number') {
                let AppIdSection = document.querySelector(`#game_area_purchase_section_add_to_cart_${arrAppId[index]}`);
                if (AppIdSection !== null) {
                    let divAppId = document.createElement('div');
                    divAppId.className ='discount_prices';
                    divAppId.innerText = arrAppId[index];
                    AppIdSection.querySelector(`.game_purchase_action_bg`).prepend(divAppId);
                }
            }
        }
    }

    let gameAppHtml = document.getElementsByClassName("block responsive_apppage_details_right heading")[0];
    if (typeof gameId === 'number') {
    
    //внешний блок div
    let divBlockRight =  document.createElement('div');
    divBlockRight.className = "block responsive_apppage_details_right recommendation_reasons";
    //link
    let steamDB = document.createElement('a');  
    steamDB.href = `https://steamdb.info/app/${gameId}/subs/`;
    steamDB.innerHTML = 'steamDB';
    divBlockRight.innerHTML = `<br> <button id ="activateGame">Activate</button> 
    <input type="text" id ="appId"  placeholder="AppId"> </input>`;
    divBlockRight.prepend(steamDB);
    gameAppHtml.before(divBlockRight);
    }
    let activateGameButton = document.querySelectorAll('#activateGame')[0];

    activateGameButton.addEventListener("click", function (event) {
        let inputAppId = document.querySelectorAll('#appId')[0];
        let inputAppIdArr = inputAppId.value.trim();
        gameActivation(inputAppIdArr);
    });

}

