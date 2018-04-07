class Application {
    constructor({view, router}) {
        this.router = router;
        router.routerMap.forEach(route => {
            const {model, controller, pathname} = route;
            route.render = () =>
                view.createRenderFunction({model, controller})(pathname);
            controller.methods._route = router.startRouting(view);
        });
    }
}

const mainDataInput = {
    login: 'userlogin',
    userName: 'Andrei',
};

// const data = {
//   contacts: { phone: '123123', email: 'asdfasdf' },
//   articles,
//   bannerList,
//   menuItems,
//   currentArticle: {},
// };

const methods = {
    showClick(d) {
    },
};

const storage = new Storage(mainDataInput);

const view = new View();
const model = new Model({}, storage);
const controller = new Controller(methods);
const router = new Router([
    {pathname: 'index_fw2.html', model: model, controller: controller},
    {pathname: 'test.html', model: model, controller: controller},
    {pathname: 'index.html', model: model, controller: controller},
    {pathname: 'review.html', model: model, controller: controller},
    {pathname: 'news.html', model: model, controller: controller}
]);

const app = new Application({view, model, controller, router});
app.router.routerMap.find((route) => route.pathname === location.pathname.slice(location.pathname.lastIndexOf("/") + 1)).render();
