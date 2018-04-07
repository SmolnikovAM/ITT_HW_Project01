// eslint-disable-next-line
class Router {
  constructor(routerMap = []) {
    this.routerID = Symbol('routerID');
    this.routerMap = routerMap.map(
      ({ pathname, model, controller, beforeRender }) => ({
        pathname,
        model,
        controller,
        render: () => {},
        beforeRender:
          beforeRender ||
          ((_, cb) => {
            cb();
          }),
      }),
    );

    window.addEventListener('popstate', () => {
      this.route(window.location.href, false);
    });
  }
  // eslint-disable-next-line
  parseURL(href) {
    const aTmp = document.createElement('a');
    aTmp.href = href;
    const {
      protocol, // => "http:"
      hostname, // => "example.com"
      port, // => "3000"
      pathname, // => "/pathname/"
      search, // => "?search=test"
      hash, // => "#hash"
      host, // => "example.com:3000"
    } = aTmp;

    const params = search
      .replace('?', '')
      .split('&')
      .map(x => x.split('='))
      .reduce((a, b) => {
        a[b[0]] = b[1]; // eslint-disable-line
        return a;
      }, {});
    // console.log(pathname, search);
    return {
      protocol, // => "http:"
      hostname, // => "example.com"
      port, // => "3000"
      pathname, // => "/pathname/"
      search, // => "?search=test"
      hash, // => "#hash"
      host,
      params,
    };
  }
  route(href, history = true) {
    const parse = this.parseURL(href);
    const page = this.routerMap.find(x => x.pathname === parse.pathname);
    if (page === undefined) return;
    page.model.data.params = parse.params;
    const cb = () => {
      // console.log(href, page);

      const renderPage = () => {
        if (history) {
          window.history.pushState({ href }, page.title, href);
        }
        page.render();
      };
      if (
        !Reflect.has(this.view.HTMLSource, parse.pathname) &&
        this.view.parsedFiles.indexOf(parse.pathname) === -1
      ) {
        // parse.pathname
        fetch(href, new Headers({ 'Content-Type': 'text/plain' }))
          .then(res => res.text())
          .then(res => {
            const fr = document.createElement('div');
            fr.innerHTML = res;
            this.view.patternParse(fr);
            renderPage();
          });
      } else renderPage();
    };

    page.beforeRender(page.model, cb);
  }

  startRouting(view) {
    this.view = view;
    return (...args) => this.route(...args);
  }
}
