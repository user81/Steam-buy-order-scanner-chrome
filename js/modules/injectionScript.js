function injectionMyScript (scriptString, removeScript, injectid, someHtmlAttribute = null) {
  if (document.getElementById(injectid) !== null) {
    document.getElementById(injectid).remove();
  }
  let injectScript = document.createElement('script');
  injectScript.id = injectid;
  injectScript.text = scriptString;
  (document.head || document.documentElement).appendChild(injectScript);
  if (someHtmlAttribute === null) {
    return true;
  }
  const AttributeList = ['session_id'];
  
  let includeVal = (AttributeList.includes(someHtmlAttribute)) ? document.querySelector('body').getAttribute(someHtmlAttribute) : null; 
  if (includeVal !== null) {
    document.querySelector('body').removeAttribute(someHtmlAttribute);
  }
  if (removeScript) { 
    document.head.removeChild(mySessionId);
  }
  return includeVal;
}


