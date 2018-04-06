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
    login: 'user login',
    userName: 'user name',
};

const data = {
    // model.data
    someText: 'something',
    title: 'header',
    nameSmth: [
        {text: 'link to first page', link: '/html/learning/learn.html'},
        {text: 'link to second page', link: '/html/learning/learn_p2.html'},
        {text: 'link to third page', link: '/html/learning/learn_p3.html'},
    ],
    articles: {test1: {field2: 'deep text '}},
};

const methods = {
    showClick(d) {
    },
};

const storage = new Storage(mainDataInput);
const view = new View();
const model = new Model(data, storage);
const controller = new Controller(methods);
const router = new Router([
    {
        pathname: '/html/learning/learn.html',
        model: model,
        controller: controller,
    },
    {
        pathname: '/html/learning/learn_p2.html',
        model: model,
        controller: controller,
    },
    {
        pathname: '/html/learning/learn_p3.html',
        model: model,
        controller: controller,
    },
]);

const app = new Application({view, router});

app.router.routerMap[0].render();
