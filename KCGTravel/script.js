var data;
var defaultZone = '三民區';
var selectedZoneName = defaultZone;
var selectedData = { data: [] }; // 使用者選取的行政區資料
var selectedDataProxy; // 使用者選取的行政區資料 proxy

function init() {
  var select = document.querySelector('select'); // 行政區下拉清單
  var hotDistrict = document.querySelector('.hot-district'); // 熱門行政區清單

  // AJAX　取得資料
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var rawData = JSON.parse(xhr.responseText);
      if (rawData.success) {
        data = rawData.result.records;

        // 指派預設顯示的行政區資料
        selectedDataProxy.data = filterData(defaultZone);
        renderer.init(selectedDataProxy.data);
        renderer.draw();
        return;
      }
      data = null;
    }
  };
  xhr.open(
    'GET',
    'https://raw.githubusercontent.com/hexschool/KCGTravel/master/datastore_search.json'
  );
  xhr.send();

  // 設定 event handler
  select.addEventListener('change', eventHandler['selectChange']);
  hotDistrict.addEventListener('click', eventHandler['selectHotSpot'], false);

  // 設定 proxy，當 selectedData 變動就會觸發 render 函式
  selectedDataProxy = new Proxy(selectedData, {
    set: function (target, prop, value) {
      target[prop] = value;
      renderer.init(target[prop]);
      renderer.draw();
    },
  });
}

// 篩選出目前行政區的資料
function filterData(selectedZone) {
  return data.filter(function (item) {
    if (item.Zone === selectedZone) {
      return true;
    }
  });
}

// 所有事件的處理函式
var eventHandler = {
  selectChange: function (e) {
    e.preventDefault();
    var selectedZone = e.target.value;
    selectedZoneName = selectedZone;
    selectedDataProxy.data = filterData(selectedZone);
  },

  selectHotSpot: function (e) {
    e.preventDefault();
    if (e.target.nodeName !== 'A') {
      return;
    }
    var selectedZone = e.target.dataset.value;
    selectedZoneName = selectedZone;
    selectedDataProxy.data = filterData(selectedZone);
  },

  nextPage: function (e) {
    e.preventDefault();
    renderer.redraw('next');
  },

  prevPage: function (e) {
    e.preventDefault();
    renderer.redraw('prev');
  },

  selectPage: function (e) {
    e.preventDefault();
    pageNum = parseInt(e.target.dataset.page);
    renderer.redraw(pageNum);
  },
};

// 處理旅遊景點卡片與分頁的渲染器
var renderer = {
  _pageNumber: 1, // 總頁數
  _currentPage: 1, // 目前頁面是第幾頁
  _cardNumberPerPage: 4, // 一個頁面的卡片數量
  _dataArray: [], // 這個行政區的資料
  // 渲染卡片與分頁的容器
  _cardsRenderArea: document.querySelector('.render-area'),
  _paginationRenderArea: document.querySelector('.pagination-area'),
  // 卡片與分頁的樣板
  _cardTemplate: document.getElementById('travel-card-template'),
  _paginationTemplate: document.getElementById('pagination-template'),

  // 初始化，將資料依照頁數分成多個 array
  init: function (data) {
    this._dataArray = [];

    var index = 0;
    while (index < data.length) {
      this._dataArray.push(data.slice(index, index + this._cardNumberPerPage));
      index += this._cardNumberPerPage;
    }
    this._pageNumber = this._dataArray.length || 1;
    this._currentPage = 1;
  },

  // 渲染
  draw: function () {
    this._drawCards();
    this._drawPagination();
  },

  // 換頁時重新渲染
  redraw: function (pageNumber) {
    this._currentPage = this._checkPageNumber(pageNumber);
    this._drawCards();
    this._redrawPagination();
  },

  // 渲染旅遊卡片
  _drawCards: function () {
    // 清除目前顯示的資料
    this._cardsRenderArea.textContent = '';

    // 建立 DOM fragment並插入h2與卡片容器
    var fragment = document.createDocumentFragment();
    var h2 = document.createElement('h2');
    var cardList = document.createElement('div');
    cardList.className = 'card-list';
    h2.textContent = selectedZoneName;
    fragment.appendChild(h2);
    fragment.appendChild(cardList);

    var c = this._cardTemplate;
    var dataIndex = this._currentPage - 1;
    var data = this._dataArray[dataIndex];
    data = Array.isArray(data) ? data : []; // 排除 data 為 undefined 的情況

    // 如果選擇的區域有資料就複製 template 並帶入相應的資料
    if (data.length > 0) {
      data.forEach((el) => {
        var clone = document.importNode(c.content, true);
        clone.getElementById('card-img').src = el.Picture1;
        clone.getElementById('card-title').textContent = el.Name;
        clone.getElementById('card-subtitle').textContent = el.Zone;
        clone
          .getElementById('card-time')
          .insertAdjacentText('beforeend', el.Opentime);
        clone
          .getElementById('card-address')
          .insertAdjacentText('beforeend', el.Add);
        clone
          .getElementById('card-tel')
          .insertAdjacentText('beforeend', el.Tel);
        clone
          .getElementById('card-tag')
          .insertAdjacentText('beforeend', el.Ticketinfo);
        cardList.appendChild(clone);
      });
    } else {
      cardList.innerHTML = '<p class="no-card">查無資料</p>';
    }
    this._cardsRenderArea.appendChild(fragment);
  },

  // 渲染分頁功能
  _drawPagination: function () {
    var p = this._paginationTemplate;
    var clone = document.importNode(p.content, true);
    var len = this._pageNumber;
    var pre = clone.getElementById('page-prev');
    var next = clone.getElementById('page-next');

    // 根據目前是第幾頁決定分頁元件的上下頁按鈕是否保留功能
    this._checkPaginationDisabled(pre, next);

    pre.firstChild.addEventListener('click', eventHandler.prevPage);
    next.firstChild.addEventListener('click', eventHandler.nextPage);

    // 依照頁數依序插入按鈕
    for (var i = 1; i <= len; i++) {
      if (i === this._currentPage)
        pre.insertAdjacentHTML(
          'afterend',
          `<li class="page-link active"><a data-page="${i}" href="#">${i}</a></li>`
        );
      else
        pre.insertAdjacentHTML(
          'afterend',
          `<li class="page-link"><a data-page="${i}" href="#">${i}</a></li>`
        );
      pre.nextElementSibling.firstChild.addEventListener(
        'click',
        eventHandler.selectPage
      );
      pre = pre.nextElementSibling;
    }

    // 清空舊資料並插入剛建立的元件
    this._paginationRenderArea.textContent = '';
    this._paginationRenderArea.appendChild(clone);
  },

  // 重新繪製分頁功能
  _redrawPagination: function () {
    var pagination = document.getElementsByClassName('pagination')[0];
    var pageLinks = pagination.getElementsByClassName('page-link');
    var len = this._pageNumber;
    var pre = document.getElementById('page-prev');
    var next = document.getElementById('page-next');

    // 判斷決定 pre 跟 next button 是不是處於 disabled 狀態
    this._checkPaginationDisabled(pre, next);

    // 讓目前頁按鈕加上 active class
    for (var i = 0; i < len; i++) {
      pageLinks[i].classList.remove('active');
      if (this._currentPage === i + 1) pageLinks[i].classList.add('active');
    }
  },

  _checkPageNumber: function (pageNumber) {
    if (pageNumber === 'next' && this._currentPage < this._pageNumber) {
      return this._currentPage + 1;
    } else if (pageNumber === 'prev' && this._currentPage > 1) {
      return this._currentPage - 1;
    } else if (typeof pageNumber === 'number') {
      return pageNumber;
    } else {
      return this._currentPage;
    }
  },

  _checkPaginationDisabled: function (pre, next) {
    if (this._currentPage === 1) {
      pre.classList.add('disable');
      next.classList.remove('disable');
    }

    if (this._currentPage === this._pageNumber) {
      next.classList.add('disable');
      pre.classList.remove('disable');
    }

    if (this._pageNumber === 1) {
      pre.classList.add('disable');
    }
  },
};

init();
