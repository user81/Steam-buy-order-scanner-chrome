let changeLabelColor = (thisDom, textDefault, textActive) => {
  thisDom.parentElement.style.color = thisDom.checked ? textActive : textDefault;
}

/**
 * Меняет цвет текста родительского элемента
 * @param {string} textActive // цвет текста
 * @param {Object} checkboxList // Dom Элемент
 */
function parentElementChaneColor(textActive, textDefault, checkboxList) {
  if (textActive, checkboxList) {
    if (checkboxList.length !== 0) {
      Array.prototype.map.call(checkboxList, (currentDom) => {
        currentDom.addEventListener("click", (event) => { 
          changeLabelColor(event.path[0], textDefault, textActive); 
        });
        if (currentDom.checked) {
          currentDom.parentElement.style.color = textActive;
        }
      });
    }
  }

}