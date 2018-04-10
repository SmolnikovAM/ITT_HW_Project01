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
};

const methods = {
  showContent(options) {
    if (options.classContent === 'hideContent') {
      options.classContent = 'show';
    } else options.classContent = 'hideContent';
    this._route(window.location.href, false); // rerender current page without hostory
  },
};

const beforeRenderMain = (model, cb) => {
  const { data } = model;
  const updateData = () => {
    data.newsToShow = data.news[data.params.id];
    if (!data.newsToShow.options)
      data.newsToShow.options = {
        classContent: 'hideContent',
        classLink: 'show',
      };
    cb();
  };

  if (data.params.id) {
    data.showArticles = false;
    data.showCurrentArticle = true;

    if (data.newsLoaded) {
      updateData();
      return;
    }
    fetch('../../data/news.json')
      .then(res => res.text())
      .then(res => {
        data.news = JSON.parse(res);
        data.newsLoaded = true;
        updateData();
      });
    return;
  }

  data.showArticles = true;
  data.showCurrentArticle = false;

  if (data.mainLoaded) {
    cb();
    return;
  }

  fetch('../../data/main.json')
    .then(res => res.text())
    .then(res => {
      data.main = JSON.parse(res);
      data.mainLoaded = true;
      cb();
    });
};

const storage = new Storage(storageData);
const view = new View();

const modelMain = new Model(dataMain, storage);
const controllerMainPage = new Controller(methods);
const router = new Router([
  {
    pathname: '/html/concept/index.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderMain,
    startPage: true,
  },
]);

const app = new Application({ view, router, beginFromStartPage: false });
