class Storage {
  constructor() {
    this.loadData();
  }
  loadData() {
    const str = localStorage.getItem('bmiData');
    const localData = JSON.parse(str);
    this.data = !localData ? [] : localData;
  }
  getDate() {
    return this.data;
  }
  storeData(newData) {
    this.data.unshift(newData);
    localStorage.setItem('bmiData', JSON.stringify(this.data));
  }
  clearData() {
    this.data = [];
    localStorage.clear();
  }
}

class UI {
  constructor() {
    this.height = document.getElementById('height');
    this.weight = document.getElementById('weight');
    this.getResult = document.getElementById('get-result');
    this.bmiHistory = document.getElementById('bmi-history');
    this.summary = document.getElementById('summary');
    this.clear = document.getElementById('clear');
  }
  showOldData(oldData) {
    if (!oldData || !oldData.length) return;
    oldData.forEach((item) => {
      this.bmiHistory.insertAdjacentHTML('beforeend', this.getTemplate(item));
    });
  }
  renderResult(bmi, { statusZh, statusEn }) {
    this.summary.innerHTML = `<p>BMI: ${bmi}  Status: ${statusZh}</p>`;
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
    return bmiData;
  }
  getUserData() {
    return {
      weight: this.weight.value,
      height: this.height.value,
    };
  }
  getTemplate(bmiData) {
    return `<li class="${bmiData.statusEn}">
              <div class="cell status">${bmiData.statusZh}</div> 
              <div class="cell bmi"><small>BMI</small>&nbsp;${bmiData.bmi}</div> 
              <div class="cell weight"><small>weight</small>&nbsp;${bmiData.weight}</div> 
              <div class="cell height"><small>height</small>&nbsp;${bmiData.height}</div> 
              <div class="cell date"><small>${bmiData.today}</small></div> 
            </li>`;
  }
  addGetResultEvent(handler) {
    this.getResult.addEventListener('click', handler);
  }
  addClearHistoryEvent(storage) {
    this.clear.addEventListener('click', () => {
      storage.clearData();
      this.bmiHistory.innerHTML = '';
    });
  }
}

class Utils {
  static calculateBmi(weight, height) {
    const w = parseInt(weight);
    const h = parseInt(height) / 100;

    if (!w || !h || w <= 0 || h <= 0) {
      return false;
    }
    const bmi = (w / (h * h)).toFixed(2);

    if (bmi <= 0 || !isFinite(bmi) || isNaN(bmi)) {
      return false;
    } else {
      return bmi;
    }
  }
  static getToday() {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = month / 10 < 1 ? `0${month}` : month.toString();
    const day = d.getDate();
    return `${monthStr}-${day}-${year}`;
  }
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

function init() {
  const storage = new Storage();
  const ui = new UI();

  ui.showOldData(storage.getDate());
  ui.addGetResultEvent(function () {
    const { weight, height } = ui.getUserData();
    const bmi = Utils.calculateBmi(weight, height);
    if (!bmi) {
      alert('數值錯誤，請重新輸入');
      return;
    }
    const status = Utils.checkBmiStatus(bmi);
    const newData = ui.renderResult(bmi, status);
    storage.storeData(newData);
  });
  ui.addClearHistoryEvent(storage);
}

init();
