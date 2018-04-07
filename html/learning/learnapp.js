class Application {
  constructor({ view, router }) {
    this.router = router;
    router.routerMap.forEach(route => {
      const { model, controller, pathname } = route;
      // eslint-disable-next-line
      route.render = () =>
        view.createRenderFunction({ model, controller })(pathname);
      controller.methods._route = router.startRouting(view);
    });
  }
}

const mainDataInput = {
  login: 'user login',
  userName: 'user name',
};

const data = {
  someText: 'something',
  title: 'header',
  nameSmth: [
    { text: 'link to first page', link: '/html/learning/learn.html' },
    { text: 'link to second page', link: '/html/learning/learn_p2.html' },
    { text: 'link to third page', link: '/html/learning/learn_p3.html' },
  ],
  articles: { test1: { field2: 'deep text ' } },
};

console.log(data.articles.test1.field2);

const methods = {
  showClick() {},
};

const methodsTabs = {
  showClick() {},
};

const dataForTabs = {
  articlesToShow: [],
  pageCount: 6,
  pageNext: 2,
  pageBack: 0,
  showBack: true,
  showNext: true,
};

dataForTabs.articles = Array.from({ length: 55 }).map((_, i) => ({
  id: i + 1,
  name: `article ${i + 1}`,
  text: `text ${i +
    1} Lorem ipsum dolor sit amet consectetur, adipisicing elit.`,
}));

// dataForTabs.pageCount = dataForTabs.ar

const storage = new Storage(mainDataInput);
const view = new View({ appId: 'app' });
const modelInit = new Model(data, storage);
const controllerInit = new Controller(methods);

const modelTabs = new Model(dataForTabs, storage);
const controllerTabs = new Controller(methodsTabs);

const beforeRenderArticles = (model, cb) => {
  let { page } = model.data.params;
  const { pageCount, articles } = model.data;
  if (page === undefined) page = 1;
  const { length } = articles;
  model.data.articlesToShow = articles.filter(
    (val, index) =>
      index >= Math.ceil(length * (page - 1) / pageCount) &&
      index < Math.ceil(length * page / pageCount),
  );
  model.data.pageBack = Number(page) - 1;
  model.data.pageNext = Number(page) + 1;

  model.data.showBack = !(page <= 1);
  model.data.showNext = !(page >= pageCount);

  // this callback for async rendering
  cb();
};

const router = new Router([
  {
    pathname: '/html/learning/learn.html',
    model: modelInit,
    controller: controllerInit,
  },
  {
    pathname: '/html/learning/template.html',
    model: modelInit,
    controller: controllerInit,
  },
  {
    pathname: '/html/learning/mustache.html',
    model: modelInit,
    controller: controllerInit,
  },
  {
    pathname: '/html/learning/tabs.html',
    model: modelTabs,
    controller: controllerTabs,
    beforeRender: beforeRenderArticles,
  },
]);

const app = new Application({ view, router });

app.router.routerMap[0].render();
