const storageData = {
  login: 'userlogin',
  userName: 'Andrei',
};

const dataMain = {
  main: {},
  mainLoaded: false,
  news: {},
  newsToShow: {},
  newsLoaded: false,
  showArticles: false,
  showCurrentArticle: false,
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
  const updateData = () => {
    if (data.newsLoaded && data.params.id) {
      data.newsToShow = data.news[data.params.id];
      if (!data.newsToShow.options)
        data.newsToShow.options = {
          classContent: 'hideContent',
          classLink: 'show',
          textForShowHideButton: 'show more',
        };
    }

    cb();
  };

  if (data.params.id) {
    data.showArticles = false;
    data.showCurrentArticle = true;
    // data.showSearch = false;
    if (data.newsLoaded) {
      updateData();
      return;
    }
    loadContent('data/news.json', data, 'news', 'newsLoaded', updateData);
    return;
  }

  data.showArticles = true;
  data.showCurrentArticle = false;
  //   data.showSearch = false;
  if (data.mainLoaded) {
    cb();
    return;
  }
  loadContent('data/main.json', data, 'main', 'mainLoaded', cb);
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
]);

const app = new Application({ view, router, beginFromStartPage: true });
