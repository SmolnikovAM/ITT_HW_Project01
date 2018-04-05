class Application {
  constructor({ view, model, router, controller }) {
    this.render = view.createRenderFunction({ model, controller });
    this.render('main');
  }
}

const mainData = {
  login: 'userlogin',
  userName: 'Andrei',
};

const data = {
  contacts: { phone: '123123', email: 'asdfasdf' },
  articles,
  bannerList,
  menuItems,
  currentArticle: {},
};

const methods = {
  showClick(d) {
    alert(` asdf ${d}`);
  },
};

const view = new View();
const model = new Model(data, mainData);
const controller = new Controller(methods);
const router = new Router();

const app = new Application({ view, model, controller, router });
