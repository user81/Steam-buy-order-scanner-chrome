function injectionMyScript(scriptString, removeScript, injectid, someHtmlAttribute = null) {
    if (document.getElementById(injectid) !== null) {
        document.getElementById(injectid).remove();
    }
    let injectScript = document.createElement('script');
    injectScript.id = injectid;
    injectScript.text = scriptString;
    (document.head || document.documentElement).appendChild(injectScript);

    if (someHtmlAttribute !== null) {
        const AttributeList = ['session_id', 'market_hash_name'];
        let includeVal = (AttributeList.includes(someHtmlAttribute)) ? document.querySelector('body').getAttribute(someHtmlAttribute) : null;
        if (includeVal !== null) {
            document.querySelector('body').removeAttribute(someHtmlAttribute);
        }
        if (removeScript) {
            document.head.removeChild(injectScript);
        }
        return includeVal;
    }
    if (removeScript) {
        document.head.removeChild(injectScript);
    }
}
// id сесии
function SessionIdVal() {
    let injectionSessionIdScript = `document.querySelector('body').setAttribute('session_id', g_sessionID);`;
    return injectionMyScript(injectionSessionIdScript, true, 'mySessionId', 'session_id');
}
// appid и hach_name listings на странице пердмета
function GetMarketHashNname() {
    let injectionSessionIdScript = `

    let hashName ='';
    if ('market_hash_name' in Object.values(g_rgAssets)[0]) {
        hashName =  Object.values(g_rgAssets)[0].market_hash_name;
    }else if ('market_hash_name' in Object.values(Object.values(g_rgAssets)[0])[0] ) {
        hashName =  Object.values(Object.values(g_rgAssets)[0])[0].market_hash_name;
    }
    else if ('market_hash_name' in Object.values(Object.values(Object.values(g_rgAssets)[0])[0])[0]) {
        hashName =  Object.values(Object.values(Object.values(g_rgAssets)[0])[0])[0].market_hash_name;
    }

    document.querySelector('body').setAttribute('market_hash_name', hashName);
    `;
    return injectionMyScript(injectionSessionIdScript, false, 'myMarketHashNameId', 'market_hash_name');
}
// активация игры
function gameActivation(inputAppIdArr) {
    let injectionSessionIdScript = `AddFreeLicense(${+inputAppIdArr});`;
    return injectionMyScript(injectionSessionIdScript, true, 'gameActivation');
}
// изменить размер страницы
function changeSearchSize(pageSize = 0) {
	if (pageSize >0) pageSize--;
	let injectionSessionIdScript = `
    g_oSearchResults.m_cPageSize = 100; 
    g_oSearchResults.GoToPage(${pageSize}, true); 
    `;
    return injectionMyScript(injectionSessionIdScript, true, 'changeSearchSize');
}
// изменить размер истории
function showHistory(OrdersCount = 500) {
	let injectionSessionIdScript = `
    var g_bBusyLoadingMarketHistory = false;
    var g_oMyHistory = null;
    function LoadMarketHistory()
    {
        if ( g_bBusyLoadingMarketHistory )
        {
            return;
        }
    
        g_bBusyLoadingMarketHistory = true;
        var elMyHistoryContents = $('tabContentsMyMarketHistory');
        new Ajax.Request( 'https://steamcommunity.com/market/myhistory', {
            method: 'get',
            parameters: {
                count:${OrdersCount}
            },
            onSuccess: function( transport ) {
                if ( transport.responseJSON )
                {
                    var response = transport.responseJSON;
                
                    elMyHistoryContents.innerHTML = response.results_html;
                
                    MergeWithAssetArray( response.assets );
                
                    g_oMyHistory = new CAjaxPagingControls(
                            {
                                query: '',
                                total_count: response.total_count,
                                pagesize: response.pagesize,
                                prefix: 'tabContentsMyMarketHistory',
                                class_prefix: 'market'
                            }, 'https://steamcommunity.com/market/myhistory/'
                    );
                        
                    g_oMyHistory.SetResponseHandler( function( response ) {
                        MergeWithAssetArray( response.assets );
                    });
                }
            },
            onComplete: function() { g_bBusyLoadingMarketHistory = false; }
        });
    }
    `;
    return injectionMyScript(injectionSessionIdScript, false, 'changeSearchSize');
}

let DomRemove = (Dom) => { console.log(Dom); if (Dom !== undefined && Dom !== null) Dom.remove(); }
