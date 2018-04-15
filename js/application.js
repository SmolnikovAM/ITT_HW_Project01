const storageData = {
  loadedData: {
    users: false,
    usersPath: '/data/auth.json',
    review: false,
    reviewPath: '/data/review.json',
    listOfPhones: false,
    listOfPhonesPath: '/data/mobiles.json',
    newsPath: '/data/news.json',
    news: false,
  },
  auth: {
    isAuth: false,
    notAuth: true,
    isAdmin: false,
    name: '',
  },
  users: {},
  review: {},
  news: {},
  listOfPhones: {},
};

const dataMain = {
  main: {},
  loginPanel: {
    login: '',
    showLoginPanel: false,
    password: '',
    loginErrorText: '',
  },
  registerPanel: {
    showRegisterPanel: false,
    login: '',
    name: '',
    password1: '',
    password2: '',
    registerErrorText: '',
  },
  search: '',
};

const methods = {
  startAuth() {
    const { data } = this._model;
    data.loginPanel.showLoginPanel = true;
    data.registerPanel.showRegisterPanel = false;
    this._router.refresh();
  },
  logout() {
    const { data } = this._model;
    data.loginPanel.loginErrorText = '';
    data.mainData.auth = storageData.auth;
    data.loginPanel.showLoginPanel = false;
    data.registerPanel.showRegisterPanel = false;
    this._router.refresh();
  },
  startRegister() {
    const { data } = this._model;
    data.loginPanel.showLoginPanel = false;
    data.registerPanel.showRegisterPanel = true;

    this._router.refresh();
  },
  loginCheck() {
    const { data } = this._model;
    const user = data.mainData.users.find(
      x =>
        x.password === data.loginPanel.password &&
        x.login === data.loginPanel.login,
    );
    data.password = '';
    if (user) {
      data.loginPanel.showLoginPanel = false;
      data.mainData.auth = user;
      data.loginPanel.loginErrorText = '';
    } else {
      data.loginPanel.loginErrorText = 'NOT found';
      data.mainData.auth = storageData.auth;
    }
    this._router.refresh();
  },

  register() {
    const { data } = this._model;
    const { registerPanel } = data;
    const { login, name, password1, password2 } = registerPanel;
    if (data.mainData.users.find(x => x.login === login)) {
      registerPanel.registerErrorText = 'already have such login';
      this._router.refresh();
      return;
    }

    if (password1 !== password2) {
      registerPanel.registerErrorText = 'passwords are not equal';
      this._router.refresh();
      return;
    }

    if (password1.length <= 7) {
      registerPanel.registerErrorText = 'password too short ';
      this._router.refresh();
      return;
    }

    const user = {
      login,
      name,
      password: password1,
      isAuth: true,
      notAuth: false,
      isAdmin: false,
    };

    registerPanel.registerErrorText = '';
    data.mainData.users = [...data.mainData.users, user];
    data.registerPanel.showRegisterPanel = false;
    data.mainData.auth = user;
    this._router.refresh();
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
};

function loadToStorage(model, dataName) {
  const { storage } = model;
  if (storage.mainData.loadedData[dataName]) {
    return new Promise(res => res());
  }
  return fetch(storage.mainData.loadedData[`${dataName}Path`])
    .then(res => res.json())
    .then(res => {
      // console.log(res);
      storage.mainData[dataName] = res;
      storage.mainData.loadedData[dataName] = true;
    });
}

const beforeRenderMain = (model, cb) => {
  const { data } = model;

  loadToStorage(model, 'review')
    .then(() => loadToStorage(model, 'users'))
    .then(() => {
      let i = 1;
      const keyData = Object.keys(data.mainData.review);
      while (i < 5 && keyData.length > i) {
        data.main[i] = data.mainData.review[keyData[i]];
        i += 1;
      }
    })
    .then(cb);
};

const beforeRenderSearch = (model, cb) => {
  const { data } = model;
  loadToStorage(model, 'listOfPhones')
    .then(() => {
      if (data.params.query) {
        data.searchList = data.mainData.listOfPhones.filter(
          x =>
            x.name.toUpperCase().indexOf(data.params.query.toUpperCase()) >= 0,
        );
      }
    })
    .then(cb);
};

const beforeRenderReview = (model, cb) => {
  const { data } = model;
  const { mainData } = data;
  let id = Number(data.params.id) || 1;

  loadToStorage(model, 'review')
    .then(() => {
      const { length } = Object.keys(mainData.review);
      if (id <= 0 || id > length) id = 1;
      data.reviewToShow = mainData.review[id];
      if (!data.reviewToShow.options)
        data.reviewToShow.options = {
          linkPrevios: id - 1 > 0 ? id - 1 : length,
          linkNext: id + 1 <= length ? id + 1 : 1,
        };
    })
    .then(cb);
};

const beforeRenderShop = (model, cb) => {
  const { data } = model;
  loadToStorage(model, 'listOfPhones').then(cb);
};

const beforeRenderNews = (model, cb) => {
  const { data } = model;
  loadToStorage(model, 'news').then(cb);
};

const beforeRenderAdmin = (model, cb) => {
  const { data } = model;
  cb();
  return; //for testing

  loadToStorage(model, 'listOfPhones')
    .then(() => loadToStorage(model, 'news'))
    .then(() => loadToStorage(model, 'review'))
    .then(() => {
      cb();
      if (!data.mainData.auth.isAdmin) throw new Error('No rights');
    })
    .then(cb)
    .catch(() => model._router.goToStartPage());
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
  {
    pathname: '/admin/admin.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderAdmin,
    startPage: false,
  },
  {
    pathname: '/admin/admin-news.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderAdmin,
    startPage: false,
  },
  {
    pathname: '/admin/admin-review.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderAdmin,
    startPage: false,
  },
  {
    pathname: '/admin/admin-shop.html',
    model: modelMain,
    controller: controllerMainPage,
    beforeRender: beforeRenderAdmin,
    startPage: false,
  },
]);

const app = new Application({ view, router, beginFromStartPage: true });
