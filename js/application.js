class Application {
  constructor({ view, router }) {
    router.routerMap.forEach(route => {
      const { model, controller, pathname } = route;
      route.render = () =>
        view.createRenderFunction({ model, controller })(pathname);
      controller.methods._route = router.startRouting(view);
    });

    router.routerMap[0].render();

    // this.render =
    // this.render('main');
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
const router = new Router([
  { pathname: '/index_fw2.html', model: model, controller: controller },
  { pathname: '/test.html', model: model, controller: controller },
]);

const app = new Application({ view, model, controller, router });
