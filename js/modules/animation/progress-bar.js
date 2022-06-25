/**
 * Проверяем чтобы число не превышало 100%
 * @param {integer} data 
 * @returns {integer} число которое не привысит 100
 */
let widthLineBar = (data) => data < 100 ? data : 100;

/**
 * Выставляем длину линии загрузки
 * @param {object} bar Dom элемент
 * @param {string} lineCalssName имя класса div блока который мы хотим поменять
 * @param {integer} widthVal Процент на который мы хотим увеличить div блок
 */
function moveLineBar(bar, lineCalssName, widthVal) {
  let lineCalssBlock = bar.getElementsByClassName(lineCalssName);
  if (lineCalssBlock) {
    lineBarDom = lineCalssBlock[0];
    lineBarDom.style.width = widthVal + "%";
  }
}

/**
 * Возвращает число, которе является процентом на которо надо увеличить div 
 * @param {integer} count номер итерации в данный момент
 * @param {integer} maxCount всего итераций
 * @returns {integer} возвращает число, которе является процентом на которо надо увеличить div
 */
let lineBarWidth = (count, maxCount) => widthLineBar(Math.round((count / maxCount) * 100));

/**
 * Прослушиваем линии загрузки с помощью observer и если textContent элемента поменяся мы выплняем moveLineBar()
 * @param {string} elemClassName класс блока загруки
 * @param {string} lineCalssName класс блока линии который меняется
 * @param {string} percentageCalssName класс блока который мы прослушиваем, изменилось ли его значение
 */
function lineBarRender(elemClassName = "myProgressLine", lineCalssName = "myBarsLine", percentageCalssName = "percentageOfCompletion") {
  let AllBars = document.getElementsByClassName(elemClassName);
  if (AllBars) {
    Array.prototype.map.call(AllBars, (bar) => {
      let percentageBlock = bar.getElementsByClassName(percentageCalssName);
      if (percentageBlock) {
        let percentageOfCompletion = percentageBlock[0];
        const observer = new MutationObserver((mutationRecords) => {
          let widthVal = mutationRecords[0].addedNodes[0].textContent;
          console.log(mutationRecords);
          if (!isNaN(widthVal)) {
            moveLineBar(bar, lineCalssName, widthVal);
          }
        });

        observer.observe(percentageOfCompletion, {
          characterData: false, attributes: false, childList: true, subtree: false
        });
      }
    });
  }


}
/**
 * Обновляем состояние процеса и Длину линии загрузки
 * @param {text} idBarName Id конкретного Bar
 * @param {integer} loadinCount номер итерации в данный момент
 * @param {integer} allCount всего итераций
 * @param {Text} tupeName название итерации 
 * @param {Text} percentage имя блока в котором меняется процент загрузки,
 * который прослушивается lineBarRender()
 * @param {Text} myBarsVal текстовое содержимое страницы загрузки
 */
function changeSizeLineBar(idBarName, loadinCount, allCount, tupeName, percentage = "percentageOfCompletion", myBarsVal = "myBarsVal") {
  if (!isNaN(loadinCount) && !isNaN(allCount)) {
    let widthVal = lineBarWidth(loadinCount, allCount);
    let myProgresLoading = document.getElementById(idBarName);
    myProgresLoading.getElementsByClassName(percentage)[0].textContent = widthVal;
    let textBar = `${allCount} / ${loadinCount} ${tupeName}`;
    myProgresLoading.getElementsByClassName(myBarsVal)[0].textContent = textBar;
  }
}