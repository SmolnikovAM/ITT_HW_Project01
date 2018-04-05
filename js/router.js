// eslint-disable-next-line
class Router {
  constructor(routerMap = []) {
    this.routerID = Symbol('routerID');
    this.routerMap = routerMap.map(({ pathname, model, controller }) => ({
      pathname,
      model,
      controller,
      render: () => {},
    }));

    window.addEventListener('popstate', e => {
      this.route(window.location.href, false);
      // console.log(e);
    });
  }
  parseURL(href) {
    this;
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
    const renderPage = () => {
      if (history) {
        window.history.pushState({ href }, page.title, page.pathname);
      }
      page.render();
    };
    if (this.view.parsedFiles.indexOf(parse.pathname) === -1) {
      fetch(`${parse.pathname}`, new Headers({ 'Content-Type': 'text/plain' }))
        .then(res => res.text())
        .then(res => {
          const fr = document.createElement('div');
          fr.innerHTML = res;
          this.view.patternParse(fr);
          renderPage();
        });
    } else renderPage();
  }
  startRouting(view) {
    // window.addEventListener('popstate', e => {
    //   // showPage(getUrlPage(location.href));
    //   console.log(window.location.href);
    // });
    this.view = view;

    return (...args) => this.route(...args);
  }
}
