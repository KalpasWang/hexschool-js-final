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
    if (!oldData.length) return;
    oldData.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `
        ${item.status} 
        BMI:${item.bmi} 
        Weight:${item.w} 
        height:${item.h} 
        ${item.today}
      `;
      this.bmiHistory.appendChild(li);
    });
  }
  renderResult(bmi, status) {
    this.summary.innerHTML = `<p>BMI: ${bmi}  Status: ${status}</p>`;
    const today = Utils.getToday();
    const w = this.weight.value;
    const h = this.height.value;
    this.bmiHistory.insertAdjacentHTML(
      'afterbegin',
      `<li>${status} 
        BMI:${bmi} 
        Weight:${w} 
        height:${h} 
        ${today}
      </li>`
    );
    return {
      bmi,
      status,
      w,
      h,
      today,
    };
  }
  getUserData() {
    return {
      weight: this.weight.value,
      height: this.height.value,
    };
  }
  addGetResultEvent(handler) {
    this.getResult.addEventListener('click', handler);
  }
  addClearHistoryEvent(handler) {
    this.clear.addEventListener('click', function () {
      handler();
      bmiHistory.innerHTML = '';
    });
  }
}

class Utils {
  static calculateBmi(weight, height) {
    const w = Number.parseInt(weight);
    const h = Number.parseInt(height) / 100;
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
    let status = '理想';
    const underweight = '過輕';
    const overweight = '過重';
    const obeseClass1 = '輕度肥胖';
    const obeseClass2 = '中度肥胖';
    const obeseClass3 = '重度肥胖';

    if (bmi < 18.5) status = underweight;
    else if (bmi >= 24 && bmi < 27) status = overweight;
    else if (bmi >= 27 && bmi < 30) status = obeseClass1;
    else if (bmi >= 30 && bmi < 35) status = obeseClass2;
    else if (bmi >= 35) status = obeseClass3;

    return status;
  }
}

function init() {
  const storage = new Storage();
  const ui = new UI();

  ui.showOldData(storage.getDate());
  ui.addGetResultEvent(function () {
    const { weight, height } = ui.getUserData();
    const bmi = Utils.calculateBmi(weight, height);
    const status = Utils.checkBmiStatus(bmi);
    const newData = ui.renderResult(bmi, status);
    storage.storeData(newData);
  });
  ui.addClearHistoryEvent(storage.clearData);
}

init();
