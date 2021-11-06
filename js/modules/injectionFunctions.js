/**
 * 
 * @returns 
 * Возрашает id сесии
 * 
 */
function SessionIdVal() {
    let injectionSessionIdScript = `document.querySelector('body').setAttribute('session_id', g_sessionID);`;
    return injectionMyScript(injectionSessionIdScript, true, 'mySessionId', 'session_id');
}

