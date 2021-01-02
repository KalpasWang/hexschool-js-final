// 處理 local storage 的讀取
class Storage {
  constructor() {
    this.loadData();
  }
  // 讀取 local storage 的歷史資料
  loadData() {
    const str = localStorage.getItem('bmiData');
    const localData = JSON.parse(str);
    this.data = !localData ? [] : localData;
  }
  // 回傳現有資料的拷貝
  getDate() {
    return this.data.slice(0);
  }
  // 儲存資料
  storeData(newData) {
    this.data.unshift(newData);
    localStorage.setItem('bmiData', JSON.stringify(this.data));
  }
  // 清除所有資料
  clearData() {
    this.data = [];
    localStorage.clear();
  }
}

// 處理畫面元件的顯示以及事件的綁定、特效等
class UI {
  // 建立的時候取得所有所需的 DOM 元素
  // 並將沒有需要外部資訊的元素綁定事件
  constructor() {
    this.height = document.getElementById('height');
    this.weight = document.getElementById('weight');
    this.getResult = document.getElementById('get-result');
    this.bmiHistory = document.getElementById('bmi-history');
    this.summary = document.getElementById('summary');
    this.clear = document.getElementById('clear');
    this.refresh = document.getElementById('refresh');
    this.addRefreshEvent();
  }
  // 將歷史資料顯示在列表
  showOldData(oldData) {
    if (!oldData || !oldData.length) return;
    oldData.forEach((item) => {
      this.bmiHistory.insertAdjacentHTML(
        'beforeend',
        // 後面的 true 表示這是舊資料
        this.getTemplate(item, true)
      );
    });
  }
  // 將計算出來的 BMI 與 身體肥胖狀態渲染到畫面上
  renderResult(bmi, { statusZh, statusEn }) {
    this.summary.querySelector('.status').className = `status ${statusEn}`;
    this.summary.querySelector('.status-circle-title').textContent = `${bmi}`;
    this.summary.querySelector('.status-title').textContent = `${statusZh}`;

    // 切換顯示結果
    this.fadeIn(this.summary);
    this.fadeOut(this.getResult);
    this.refresh.setAttribute('tabindex', '0');

    // 取得要渲染到歷史紀錄的資料並且套用模板顯示在畫面上
    const today = Utils.getToday();
    const weight = this.weight.value;
    const height = this.height.value;
    const bmiData = {
      bmi,
      statusZh,
      statusEn,
      weight,
      height,
      today,
    };
    this.bmiHistory.insertAdjacentHTML('afterbegin', this.getTemplate(bmiData));
    // 加上特效
    this.setListItemAnimation('li:first-child');
    return bmiData;
  }
  getUserData() {
    return {
      weight: this.weight.value,
      height: this.height.value,
    };
  }
  // 歷史紀錄樣板，如果沒有 class 沒有加上 show 會先隱藏
  getTemplate(bmiData, isOld) {
    const show = isOld ? 'show ' : '';
    return `<li class="${show}${bmiData.statusEn}">
              <div class="cell status">${bmiData.statusZh}</div> 
              <div class="cell bmi"><small>BMI</small>&nbsp;${bmiData.bmi}</div> 
              <div class="cell weight"><small>weight</small>&nbsp;${bmiData.weight}</div> 
              <div class="cell height"><small>height</small>&nbsp;${bmiData.height}</div> 
              <div class="cell date"><small>${bmiData.today}</small></div> 
            </li>`;
  }
  // 處理當按下要看結果的按鈕的事件
  addGetResultEvent(handler) {
    this.getResult.addEventListener('click', handler);
  }
  // 處理當按下要清除歷史紀錄的按鈕的事件
  addClearHistoryEvent(storage) {
    this.clear.addEventListener('click', () => {
      storage.clearData();
      this.bmiHistory.innerHTML = '';
    });
  }
  // 處理當按下要從結果返回的按鈕的事件
  addRefreshEvent() {
    const handler = () => {
      this.fadeOut(this.summary);
      this.fadeIn(this.getResult);
      this.refresh.setAttribute('tabindex', '-1');
      this.height.value = '';
      this.weight.value = '';
    };
    this.refresh.addEventListener('click', handler);
    this.refresh.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handler();
      }
    });
  }
  // 淡出特效
  fadeOut(el) {
    el.classList.add('hidden');
    el.addEventListener(
      'transitionend',
      function () {
        el.style.visibility = 'hidden';
      },
      { once: true }
    );
  }
  // 淡入特效
  fadeIn(el) {
    el.style.visibility = 'visible';
    el.classList.remove('hidden');
  }
  // 新的結果加入歷史紀錄的特效
  setListItemAnimation(selector) {
    const li = document.querySelector(selector);
    setTimeout(() => {
      li.classList.add('show');
    }, 1000);
  }
}

// 處理邏輯運算、日期換算等
class Utils {
  // 計算 BMI
  static calculateBmi(weight, height) {
    const w = parseInt(weight);
    const h = parseInt(height) / 100;

    // 如果傳入的不是數字或小於0，就回傳 false
    if (!w || !h || w <= 0 || h <= 0) {
      return false;
    }
    const bmi = (w / (h * h)).toFixed(2);

    // 如果算出來的 BMI 小於 0，或是是 infinity 或 NaN，回傳 false
    if (bmi <= 0 || !isFinite(bmi) || isNaN(bmi)) {
      return false;
    } else {
      return bmi;
    }
  }
  // 取得格式化的今天的日期：例如 12-31-2020
  static getToday() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = month / 10 < 1 ? `0${month}` : month.toString();
    const day = d.getDate();
    return `${monthStr}-${day}-${year}`;
  }
  // 確認 BMI 值對應的狀態與 class
  static checkBmiStatus(bmi) {
    let status;
    const statusMap = {
      ideal: ['理想', 'ideal'],
      underweight: ['過輕', 'underweight'],
      overweight: ['過重', 'overweight'],
      obeseClass1: ['輕度肥胖', 'obeseClass1'],
      obeseClass2: ['中度肥胖', 'obeseClass2'],
      obeseClass3: ['重度肥胖', 'obeseClass3'],
    };

    if (bmi < 18.5) status = statusMap.underweight;
    else if (bmi >= 18.5 && bmi < 24) status = statusMap.ideal;
    else if (bmi >= 24 && bmi < 27) status = statusMap.overweight;
    else if (bmi >= 27 && bmi < 30) status = statusMap.obeseClass1;
    else if (bmi >= 30 && bmi < 35) status = statusMap.obeseClass2;
    else if (bmi >= 35) status = statusMap.obeseClass3;
    else return 'Error';

    return { statusZh: status[0], statusEn: status[1] };
  }
}

// 初始化
function init() {
  const storage = new Storage();
  const ui = new UI();

  // 顯示過去的 BMI 歷史資料
  ui.showOldData(storage.getDate());
  // 當使用者按下「看結果」的按鈕，處理使用者的身高體重數據
  ui.addGetResultEvent(function () {
    const { weight, height } = ui.getUserData();
    const bmi = Utils.calculateBmi(weight, height);
    // 如果得到的 BMI 有問題(false)，則 return
    if (!bmi) {
      alert('數值錯誤，請重新輸入');
      return;
    }
    const status = Utils.checkBmiStatus(bmi);
    const newData = ui.renderResult(bmi, status);
    storage.storeData(newData);
  });
  // 綁定「清除歷史」按鈕的事件，傳入 storage 物件實體 讓 ui 可以清除歷史
  ui.addClearHistoryEvent(storage);
}

init();
