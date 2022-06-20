let widthLineBar = (data) => data < 100 ? data : 100;
function moveLineBar(bar, lineCalssName, widthVal) {
  lineBarDom = bar.getElementsByClassName(lineCalssName)[0];
  lineBarDom.style.width = widthVal + "%";
/*   lineBarDom.textContent = widthVal + "%"; */
}
let lineBarWidth = (count, maxCount) => widthLineBar(Math.round((count / maxCount) * 100));
/**
 * создать data
 */
function lineBarRender(elemClassName = "myProgressLine", lineCalssName = "myBarsLine", percentageCalssName = "percentageOfCompletion") {
  let AllBars = document.getElementsByClassName(elemClassName);

  Array.prototype.map.call(AllBars, (bar) => {
    let percentageOfCompletion = bar.getElementsByClassName(percentageCalssName)[0];

    const observer = new MutationObserver((mutationRecords) => {
      let widthVal = mutationRecords[0].addedNodes[0].textContent;
    console.log(mutationRecords);
      if (!isNaN(widthVal)) {
        moveLineBar(bar, lineCalssName, widthVal);
      }
    });

    observer.observe(percentageOfCompletion, {
      characterData: false, attributes: false, childList: true, subtree: false
    })
  });

}
