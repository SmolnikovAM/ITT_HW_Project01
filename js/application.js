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
  editNews: {
    isEdit: false,
    isAdd: true,
    title: '',
    img: '',
    id: null,
    text: '',
    textObj: {},
  },
  editReview: {
    isEdit: false,
    isAdd: true,
    title: '',
    img: '',
    id: null,
    text: '',
    textObj: {},
    iframeSrc: '',
  },
  editShop: {
    isEdit: false,
    isAdd: true,
    id: null,
    img: '',
    name: '',
    price: 0,
    warranty: '',
    contact: '',
    city: '',
    type: '',
  },
  search: '',
};

function parseText(text) {
  const arr = text
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length);
  const out = [];
  let appendNew = { text: '', title: '' };
  arr.forEach(x => {
    console.log(x);
    if (x.search(/^#/) >= 0) {
      appendNew.title = x.replace('#', '');
    } else {
      appendNew.text = x;
      out.push({ ...appendNew });
      appendNew = { text: '', title: '' };
    }
  });
  return out;
}

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

  deleteNews(id) {
    const { mainData } = this._model.data;
    mainData.news = mainData.news.filter(x => x.id !== id);
    this._router.refresh();
  },

  editNews(id) {
    const { data } = this._model;
    const { editNews } = data;
    const { mainData } = this._model.data;
    data.editNews.isAdd = true;
    data.editNews.isEdit = false;

    const article = mainData.news.find(x => x.id === id);

    editNews.title = article.title;
    editNews.img = article.img;
    editNews.id = article.id;

    let text = '';
    article.text.forEach(t => {
      text += `${t.title ? `#${t.title}` : ''}\n${t.text}\n\n`;
    });

    editNews.text = text;
    this._router.refresh();
  },

  addNews() {
    const { data } = this._model;
    const { editNews } = data;
    const { mainData } = this._model.data;
    const { title, img, textObj, text } = editNews;
    data.editNews.isAdd = true;
    data.editNews.isEdit = false;

    if (text.length === 0 || title.length === 0) return;

    fetch(img)
      .then(res => {
        if (res.status !== 200) throw Error('Not found');
        const id =
          mainData.news.reduce((a, b) => Math.max(a, b.id), -Infinity) + 1;
        editNews.textObj = parseText(editNews.text);

        const updateArticle = { id, title, img, text: textObj };

        mainData.news = [...mainData.news, updateArticle].sort(
          (a, b) => a.id - b.id,
        );
        data.editNews.title = '';
        data.editNews.text = '';
        data.editNews.img = '';
        this._router.refresh();
      })
      .catch(() => {});
  },

  updateNews(id) {
    const { data } = this._model;
    const { editNews } = data;
    const { mainData } = this._model.data;
    data.editNews.isAdd = true;
    data.editNews.isEdit = false;

    const articles = mainData.news.filter(x => x.id !== id);
    editNews.textObj = parseText(editNews.text);
    const { title, img, textObj } = editNews;
    const updateArticle = { id, title, img, text: textObj };

    mainData.news = [...articles, updateArticle].sort((a, b) => a.id - b.id);

    this._router.refresh();
  },

  updateNewsCancel() {
    const { data } = this._model;
    data.editNews.isAdd = true;
    data.editNews.isEdit = false;
    data.editNews.title = '';
    data.editNews.text = '';
    data.editNews.img = '';
    this._router.refresh();
  },

  deleteReview(id) {
    const { mainData } = this._model.data;
    mainData.review = mainData.review.filter(x => x.id !== id);
    this._router.refresh();
  },
  editReview() {},
  addReview() {},
  updateReview(id) {},
  updateReviewCancel() {},

  deleteShop() {},
  editShop() {},
  addShop() {},
  updateShop(id) {},
  updateShopCancel() {},

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

  return model._isLocalChecked
    .then(() => {
      if (storage.mainData.loadedData[dataName]) throw new Error('test');
    })
    .then(() => fetch(storage.mainData.loadedData[`${dataName}Path`]))
    .then(res => res.json())
    .then(res => {
      storage.mainData[dataName] = res;
      const tmp = { ...storage.mainData.loadedData };
      tmp[dataName] = true;
      storage.mainData.loadedData = tmp;
    })
    .catch(() => new Promise(res => res()));
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
      const ids = mainData.review.map(x => x.id);
      const len = ids.length;
      let p = ids.indexOf(id);
      if (p === -1) {
        p = 0;
        id = ids[p];
      }

      data.reviewToShow = mainData.review[id];

      data.reviewToShow.options = {
        linkPrevious: ids[p - 1 < 0 ? len - 1 : p - 1],
        linkNext: ids[p + 1 >= len ? 0 : p + 1],
      };
      // if (id <= 0 || id > length) id = 1;
      // data.reviewToShow = mainData.review[id];
      // if (!data.reviewToShow.options)
      //   data.reviewToShow.options = {
      //     linkPrevious: id - 1 > 0 ? id - 1 : length,
      //     linkNext: id + 1 <= length ? id + 1 : 1,
      //   };
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

  loadToStorage(model, 'listOfPhones')
    .then(() => loadToStorage(model, 'news'))
    .then(() => loadToStorage(model, 'review'))
    .then(() => {
      cb();
      // if (!data.mainData.auth.isAdmin) throw new Error('No rights');
    })
    .catch(() => model._router.goToStartPage());
};

function MAIN() {
  const storage = new Storage(storageData);
  console.log('storage created');
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
}

window.addEventListener('DOMContentLoaded', MAIN);
