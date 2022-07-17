/**
 * Блок где будет выводиться история
 * @param {HTMLElement} spanCountBlock // Dom элемент карточки предмета который мы будем изменять
 * @param {String} item_id // уникальный идентификатор предмета
 */
function historyChart(divItemBlock, item_id, className = "") {
  let historyChartHTML = `   
  <div id="chart_${item_id}" class ="chart ${className}">
    <canvas id="myChart_${item_id}"></canvas>
  </div>

  `;
  divItemBlock.insertAdjacentHTML('afterend', DOMPurify.sanitize(historyChartHTML));
}

function historyChartNavigation(divItemBlock, item_id) {
  let historyChartHTML = `   
    <div class="navigation-chart">
      <button class="market_searchedForTerm" id="resetChart_${item_id}">${getLocalizeText("resetChartsHistoryButton","Reset")}</button>
      <button class="market_searchedForTerm" id="forAllTime_${item_id}">${getLocalizeText("allTimeHistoryButton","All time")}</button>
      <button class="market_searchedForTerm" id="lastThirtyDays_${item_id}">30</button>
      <button class="market_searchedForTerm" id="lastsevenDays_${item_id}">7</button>
      <button class="market_searchedForTerm" id="lastDays_${item_id}">1</button>
    </div>

    <div class="navigation-chart">
      <input name="tupeHistory_${item_id}" type="radio" value="forDay" title="${getLocalizeText("countOfSalesPerDayDescription","Max value, total sold:")}">${getLocalizeText("countOfSalesPerDay","Per day")}
      <input name="tupeHistory_${item_id}" type="radio" value="allTime" title="${getLocalizeText("detailedSalesHistoryDescription","Hourly history:")}" checked> ${getLocalizeText("detailedSalesHistory","Detailed history")}
    </div>`;
  divItemBlock.insertAdjacentHTML('beforeend', DOMPurify.sanitize(historyChartHTML));
}

/**
 * Возвращает минимальную цену за день и общее количество. Мы делаем выборку только на год.
 * @param {Array} priceArr // масси цен который мы получили при запросе к серверу
 * @returns {Array} // массив цен с выборкой 1 год
 */
function minMaxPricePerDay(priceArr) {

  let nowTime = Date.parse(new Date);
  let lastYearMs = nowTime - (1000 * 60 * 60 * 24 * 30 * 12 * 5);
  let countArrYear = priceArr.map((item) => Date.parse(item[0]) > lastYearMs ? item : undefined).filter(Boolean);

  let chartsArr = [];
  let dublicateArr = [];
  let pastDate;
  countArrYear.map((priceHistoryData) => {

    const timeformat = new Date(priceHistoryData[0]).toLocaleDateString();

    if (priceHistoryData.length === 0) return;

    if (pastDate !== undefined && pastDate === timeformat) {
      dublicateArr.push(priceHistoryData);
    } else {
      pastDate = timeformat;
      let minVal;
      let maxVal;
      let countVal = 0;
      if (dublicateArr.length > 0 && dublicateArr.length !== 1) {
        dublicateArr.map((dublicateItem) => {
          if (dublicateItem[1] < minVal || minVal === undefined) {
            minVal = dublicateItem[1];
          }

          if (dublicateItem[1] > maxVal || maxVal === undefined) {
            maxVal = dublicateItem[1];
          }
          countVal += +dublicateItem[2];
        });
        if (minVal === maxVal) {
          chartsArr.push([priceHistoryData[0], minVal, countVal]);
        } else {
          chartsArr.push([priceHistoryData[0], maxVal, countVal]);
        }
        dublicateArr = [];
        return;
      }
      dublicateArr = [];
      chartsArr.push(priceHistoryData);
    }

  });
  console.log(chartsArr);
  return chartsArr;
}


function historyDataForDiagramsProcessing(historyData) {

  let xDataValues = [];
  let yPriceValues = [];
  let yNumberValues = [];
  let salesArr = [];
  let countArr = [];
  if (historyData.length <= 1) return;

  let nowTime = Date.parse(new Date);
  let lastThirtyDaysMs = nowTime - (1000 * 60 * 60 * 24 * 30);
  let lastsevenDaysMs = nowTime - (1000 * 60 * 60 * 24 * 7);
  let lastDaysMs = nowTime - (1000 * 60 * 60 * 24 * 1);

  historyData.map(itemHistory => {
    xDataValues = [...xDataValues, Date.parse(itemHistory[0])];
    yPriceValues = [...yPriceValues, itemHistory[1]];
    yNumberValues = [...yNumberValues, +itemHistory[2]];

    salesArr.push({ x: Date.parse(itemHistory[0]), y: itemHistory[1].toFixed(2) });
    countArr.push({ x: Date.parse(itemHistory[0]), y: itemHistory[2] });
  });

  let firstData = Date.parse(historyData[0][0]);
  let lastData = Date.parse(historyData[historyData.length - 1][0]);


  lastThirtyDaysMs = lastThirtyDaysMs < firstData ? firstData : lastThirtyDaysMs;
  lastsevenDaysMs = lastsevenDaysMs < firstData ? firstData : lastsevenDaysMs;
  lastDaysMs = lastDaysMs < firstData ? firstData : lastDaysMs;
  nowTime = nowTime > lastData ? lastData : nowTime;
  return { xDataValues, yPriceValues, yNumberValues, salesArr, countArr, lastThirtyDaysMs, lastsevenDaysMs, lastDaysMs, nowTime };
}


function showHistoryChart(historyData, item_id) {
  //локализация mament js
  moment.locale('ru');
  historyChartNavigation(document.getElementById(`chart_${item_id}`), item_id);

  listRadiotupeHistory = document.getElementsByName(`tupeHistory_${item_id}`);
  let HistoryVal = "";
  let historyDataUpdate = historyData;
  Array.prototype.map.call(listRadiotupeHistory,
    (currentRadio) => {
      currentRadio.addEventListener("click", UpdateData);
      if (currentRadio.checked) { 
        HistoryVal = currentRadio.value; 
        if (HistoryVal === "forDay") {
          historyDataUpdate = minMaxPricePerDay(historyData);
        }
        if (HistoryVal === "allTime") {
          historyDataUpdate = historyData;
        }
      }
    });

    
let ctx = document.getElementById(`myChart_${item_id}`).getContext('2d');
var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
gradientStroke.addColorStop(0, "#4b451e");
gradientStroke.addColorStop(1, "#5b3d25");


  let {salesArr, 
    countArr, 
    lastThirtyDaysMs, 
    lastsevenDaysMs, 
    lastDaysMs, 
    nowTime,
    firstData} = historyDataForDiagramsProcessing(historyDataUpdate);

  let zoomConfig = {
    zoom: {
      wheel: {
        enabled: false,
      },
      drag: {
        enabled: true,
      },
      pinch: {
        enabled: false
      },
      mode: 'x',

    }
  };

  const scalesConfig = {
    x: {
      fontColor: 'white',
      position: 'bottom',
      // выставляем диапазон по умолчанию min max
      min: lastThirtyDaysMs,
      max: nowTime,
      type: 'time',
      ticks: {
        autoSkip: true,
        autoSkipPadding: 50,
        maxRotation: 0
      },
      time: {
        displayFormats: {
          hour: 'HH:mm',
          minute: 'HH:mm',
          second: 'HH:mm:ss'
        }
      },
      grid: {
        color: '#1B2939',
        borderColor: '#1B2939',
        tickColor: '#1B2939'
      },
      ticks: {
        color: '#8F98A0',
      }
    },
    y: {
      fontColor: 'white',
      type: 'linear',
      position: 'left',
      grid: {
        color: '#1B2939',
        borderColor: '#1B2939',
        tickColor: '#1B2939'
      },
      ticks: {
        color: '#8F98A0',
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      // grid line settings
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
    }
  };

  let globalConfig = {
    type: 'line',
    data: {
      datasets: [{
        radius: 0,
        label: '$',
        fill: false,
        lineTension: 0,
        backgroundColor: "#101822",
        borderColor: "#688F3E",
        pointBorderWidth: 1,
        borderWidth: 2,
        data: salesArr,
        yAxisID: 'y',
      },
      {
        radius: 0,
        label: 'count',
        fill: false,
        lineTension: 0,
        borderDash: [7, 1],
        backgroundColor: "#101822",
        borderColor: gradientStroke,
        /* borderColor: "rgb(195, 180, 79)", */
        pointBorderWidth: 1,
        borderWidth: 1,
        data: countArr,
        yAxisID: 'y1',
      }

      ],
    },
    options: {
      //обединённое всплывающее окно interaction
      interaction: {
        mode: 'index',
        intersect: false,
      },
      legend: { display: false },
      scales: scalesConfig,
      plugins: {
        zoom: zoomConfig,
        legend: {
          display: false,
        }
      }
    }
  }
  let chart = new Chart(`myChart_${item_id}`, globalConfig);
  let ticks;
  document.getElementById(`resetChart_${item_id}`).onclick = () => {
    chart.resetZoom()
  };

  document.getElementById(`lastDays_${item_id}`).onclick = () => {
    ticks = chart.config.options.scales.x;
    ticks.min = lastDaysMs;
    ticks.max = nowTime;
    chart.update();
  };

  document.getElementById(`lastsevenDays_${item_id}`).onclick = () => {
    ticks = chart.config.options.scales.x;
    ticks.min = lastsevenDaysMs;
    ticks.max = nowTime;
    chart.update();
  };

  document.getElementById(`lastThirtyDays_${item_id}`).onclick = () => {
    ticks = chart.config.options.scales.x;
    ticks.min = lastThirtyDaysMs;
    ticks.max = nowTime;
    chart.update();
  };

  document.getElementById(`forAllTime_${item_id}`).onclick = () => {
    ticks = chart.config.options.scales.x;
    ticks.min = firstData;
    ticks.max = nowTime;
    chart.update();
  };

    function UpdateData(event) {
      if (event.path[0].value === "forDay" && event.path[0].value !== HistoryVal) {
        ({salesArr, 
          countArr, 
          lastThirtyDaysMs, 
          lastsevenDaysMs, 
          lastDaysMs, 
          nowTime } = historyDataForDiagramsProcessing(minMaxPricePerDay(historyData)));
          chart.config.data.datasets[0].data = salesArr;
          chart.config.data.datasets[1].data = countArr;
          chart.config.options.scales.x.min = lastThirtyDaysMs;
          chart.config.options.scales.x.max = nowTime;


        HistoryVal = event.path[0].value;
        chart.update();
      }
      if (event.path[0].value === "allTime" && event.path[0].value !== HistoryVal) {

        ({salesArr, 
          countArr, 
          lastThirtyDaysMs, 
          lastsevenDaysMs, 
          lastDaysMs, 
          nowTime } = historyDataForDiagramsProcessing(historyData));
          chart.config.data.datasets[0].data = salesArr;
          chart.config.data.datasets[1].data = countArr;
          chart.config.options.scales.x.min = lastThirtyDaysMs;
          chart.config.options.scales.x.max = nowTime;

        HistoryVal = event.path[0].value;
        chart.update();
      }
      console.log(chart.config.data.datasets[0].data);
    }
}
