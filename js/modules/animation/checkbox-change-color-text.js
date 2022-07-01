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

function showCheckboxes(expanded, checkboxes, selectOptionVal) {
if (checkboxes === null || selectOptionVal === null) return;
  let textActive = "#d9c859"
  let textDefault = "#fff"
  console.log(expanded);
  if (!expanded) {
      console.log(checkboxes);
      console.log(selectOptionVal);
      checkboxes.style.display = "block";
      selectOptionVal.style.color = textActive;
      expanded = true;
      let checkboxList = document.getElementsByClassName("select-input-value-checkbox");
      if (checkboxList.length !== 0) {
          parentElementChaneColor(textActive, textDefault, checkboxList);
      }
  } else {
      selectOptionVal.style.color = textDefault;
      checkboxes.style.display = "none";
      expanded = false;
  }
  return expanded;
}