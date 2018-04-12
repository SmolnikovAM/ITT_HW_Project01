const storageData = {
  login: 'userlogin',
  userName: 'Andrei',
};

const dataMain = {
  main: {},
  mainLoaded: false,
  reviews: {},
  reviewToShow: {},
  newsLoaded: false,
  search: '',
  listOfPhones: [],
  listOfPhonesLoaded: false,
  searchList: [],
  showSearch: false,
};

function loadContent(file, data, field, fieldBool, cb) {
  fetch(file)
    .then(res => res.text())
    .then(res => {
      data[field] = JSON.parse(res);
      data[fieldBool] = true;
      cb();
    });
}

const methods = {
  showContent(options) {
    if (options.classContent === 'hideContent') {
      options.classContent = 'show';
      options.textForShowHideButton = 'show less';
    } else {
      options.classContent = 'hideContent';
      options.textForShowHideButton = 'show more';
    }
    this._route(window.location.href, false); // rerender current page without hostory
  },
  goSearch(search, event) {
    let startSearch = false;
    if (event instanceof KeyboardEvent && event.code === 'Enter') {
      startSearch = true;
    }
    if (event instanceof MouseEvent) {
      startSearch = true;
    }
    if (startSearch) {
      this._route(`search.html?query=${search}`);
    }
  },
};

const beforeRenderSearch = (model, cb) => {
  const { data } = model;
  const updateData = () => {
    if (data.listOfPhonesLoaded && data.params.query) {
      data.searchList = data.listOfPhones.filter(
        x => x.name.toUpperCase().indexOf(data.params.query.toUpperCase()) >= 0,
      );
    }
    cb();
  };

  if (data.params.query) {
    if (data.listOfPhonesLoaded) {
      updateData();
      return;
    }
    loadContent(
      'data/mobiles.json',
      data,
      'listOfPhones',
      'listOfPhonesLoaded',
      updateData,
    );
    return;
  }
};

const beforeRenderMain = (model, cb) => {
  const { data } = model;
  if (data.mainLoaded) {
    cb();
    return;
  }
  loadContent('data/main.json', data, 'main', 'mainLoaded', cb);
};

const beforeRenderReview = (model, cb) => {
  const { data } = model;
  let id = Number(data.params.id) || 1;

  const updateData = () => {
    const { length } = Object.keys(data.reviews);
    if (id <= 0 || id > length) id = 1;
    data.reviewToShow = data.reviews[id];
    if (!data.reviewToShow.options)
      data.reviewToShow.options = {
        linkPrevios: id - 1 > 0 ? id - 1 : length,
        linkNext: id + 1 <= length ? id + 1 : 1,
      };
    cb();
  };

  if (id > 0) {
    if (data.reviewsLoaded) {
      updateData();
      return;
    }
    loadContent(
      'data/review.json',
      data,
      'reviews',
      'reviewsLoaded',
      updateData,
    );
  }
};

const beforeRenderShop = (model, cb) => {
  const { data } = model;
  if (data.shopLoaded) {
    cb();
    return;
  }
  loadContent('data/mobiles.json', data, 'shop', 'shopLoaded', cb);
};

const beforeRenderNews = (model, cb) => {
  const { data } = model;
  if (data.newsLoaded) {
    cb();
    return;
  }
  loadContent('data/news.json', data, 'news', 'newsLoaded', cb);
};

const storage = new Storage(storageData);
const view = new View();

const modelMain = new Model(dataMain, storage);
const controllerMainPage = new Controller(methods, modelMain);
const router = new Router([
  {
    pathname: '/index.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderMain,
    startPage: true,
  },
  {
    pathname: '/search.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderSearch,
    startPage: false,
  },
  {
    pathname: '/review.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderReview,
    startPage: false,
  },
  {
    pathname: '/shop.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderShop,
    startPage: false,
  },
  {
    pathname: '/news.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderNews,
    startPage: false,
  },
]);

const app = new Application({ view, router, beginFromStartPage: true });
