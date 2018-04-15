// ----------------------------
// ------APPLICATION-----------
// ----------------------------

// eslint-disable-next-line
class Application {
  constructor({ view, router, beginFromStartPage }) {
    let isMainPage = false;
    let startPageRoute;

    this.router = router;
    router.routerMap.forEach(route => {
      const { model, controller, pathname, startPage } = route;
      if (startPage) {
        if (isMainPage) throw new Error('More than one start page');
        isMainPage = true;
        startPageRoute = pathname;
      }
      // eslint-disable-next-line
      model._router = router;
      // eslint-disable-next-line
      if (model.storage) {
        model.storage._router = router;
      }
      route.render = () =>
        view.createRenderFunction({ model, controller })(pathname);
      controller.methods._route = router.startRouting(view);
      controller.methods._router = router;
    });
    if (beginFromStartPage) {
      console.log('test 0');
      // const displayBefore = view.HTMLRoot.style.visibility;
      const displayBefore = '';
      if (!startPageRoute) throw new Error('You have to select startPage');
      view.HTMLRoot.style.visibility = 'hidden';
      const destination = window.location.href;
      startPageRoute = `${window.location.protocol}//${
        window.location.hostname
      }${
        window.location.port ? ':' + window.location.port : ''
      }${startPageRoute}`;

      console.log(startPageRoute);
      router.route(startPageRoute, false, () => {
        console.log('test cb 1');
        router.route(destination, false, () => {
          console.log('test cb 2');
          view.HTMLRoot.style.visibility = displayBefore;
        });
      });
    } else {
      router.route(window.location.href, false);
    }
  }
}

// ----------------------------
// ------ VIEW ----------------
// ----------------------------
// eslint-disable-next-line
class View {
  constructor(options = {}) {
    const {
      tag = 'script',
      idPattrn = '^template_',
      type = 'text/template',
      main = '.main',
      appId,
    } = options;

    this.options = {
      tag,
      idPattrn,
      type,
      main,
      appId,
    };

    this.options.idPattrnRegExp = new RegExp(this.options.idPattrn);
    if (appId) {
      this.HTMLRoot = document.getElementById(appId);
    } else {
      this.HTMLRoot = document.querySelector(main);
    }

    if (!this.HTMLRoot) {
      this.HTMLRoot = document.createElement('div');
      document.body.appendChild(this.HTMLRoot);
      if (main) this.HTMLRoot.classList.add(main);
    }

    this.HTMLSource = {};
    this.parsedFiles = [];
    this.patternParse(document);
  }

  patternParse(DOM) {
    const arr = Array.from(DOM.getElementsByTagName(this.options.tag))
      .filter(
        el =>
          el.id.match(this.options.idPattrnRegExp) &&
          el.type === this.options.type,
      )
      .map(el => ({
        name: el.id.replace(this.options.idPattrnRegExp, ''),
        sourceHTML: el.innerHTML,
        node: null,
        converted: false,
      }));
    arr.forEach(el => {
      this.HTMLSource[el.name] = el;
    });
  }
  value(inObj, inPath, sliceFirst = false, first = true, set = false) {
    if (first) {
      let newPath = inPath;
      while (newPath.indexOf("'") >= 0 || newPath.indexOf('"') >= 0) {
        newPath = newPath.replace("'", '');
        newPath = newPath.replace('"', '');
      }
      newPath = newPath.split('.').reduce((a, b) => {
        const bb = b.split('[').map(x => x.replace(']', ''));
        return [...a, ...bb];
      }, []);
      if (sliceFirst) newPath = newPath.slice(1);
      return this.value(inObj, newPath, false, false, set);
    }
    if (inPath.length === 1 && set) {
      return {
        get: () => inObj[inPath[0]],
        set: val => {
          // eslint-disable-next-line
          inObj[inPath[0]] = val;
        },
      };
    }

    if (inPath.length === 0) {
      return inObj;
    }

    if (!Reflect.has(inObj, inPath[0]))
      throw new Error(`Parsing error ${inPath[0]}`);
    return this.value(inObj[inPath[0]], inPath.slice(1), false, false, set);
  }

  modifyElementNode({ el, data, methods }) {
    if (el.nodeType !== 3 && el.attributes) {
      Object.keys({ ...el.attributes }).forEach(key => {
        const attName = el.attributes[key].name;
        const param = el.attributes[key].value;

        if (attName.indexOf(':') >= 0) {
          const newKey = attName.replace(':', '');

          if (param.indexOf('{{') >= 0) {
            el.setAttribute(
              newKey,
              this.replaceMustache({ text: param, data }),
            );
          } else {
            el.setAttribute(newKey, this.value(data, param));
          }
        }

        if (
          (el.tagName === 'INPUT' ||
            el.tagName === 'TEXTAREA' ||
            el.tagName === 'SELECT') &&
          attName.indexOf('model') >= 0
        ) {
          const modif = this.value(data, param, false, true, true);
          // eslint-disable-next-line
          el.value = modif.get();

          if (el.tagName === 'SELECT') {
            el.addEventListener('change', () => {
              modif.set(el.value);
            });
          } else
            el.addEventListener('keyup', () => {
              modif.set(el.value);
            });
        }

        if (attName === 'if') {
          const modif = this.value(data, param);
          // eslint-disable-next-line
          if (!modif) el.style.display = 'none';
        }

        if (
          attName.indexOf('@click') >= 0 ||
          attName.indexOf('@keydown') >= 0
        ) {
          const eventMethod = attName.replace('@', '').trim();
          const paramName = el.attributes[key].value;
          const idx = paramName.indexOf('(');
          if (idx >= 0) {
            const methodName = paramName.slice(0, idx);
            const params = paramName
              .slice(idx)
              .replace(/[()\s]+/g, '')
              .split(',');

            el.addEventListener(eventMethod, e => {
              setTimeout(() => {
                const evalParams = params.map(p => this.value(data, p));
                methods[methodName](...evalParams, e);
              }, 0);
            });
          } else {
            // console.log(methods);
            if (!Reflect.has(methods, paramName)) {
              throw new Error(`No such method ${paramName}`);
            }
            el.addEventListener('click', e => methods[paramName](e));
          }
        }
      });
    }

    if (el.tagName === 'A') {
      el.addEventListener('click', e => {
        e.preventDefault();
        methods._route(el.href, e);
      });
    }
  }

  replaceMustache({ text, data }) {
    let matchVars = text.match(/{{[a-zA-Z0-9.[\]\s_]+}}/gi);
    matchVars = matchVars.map(str =>
      str
        .replace('{{', '')
        .replace('}}', '')
        .trim(),
    );
    let newText = text;
    matchVars.forEach(param => {
      const paramToRegExp = param.replace('[', '\\[').replace('.', '\\.');
      const r = new RegExp(`{{\\s*${paramToRegExp}\\s*}}`, 'gi');
      const textToReplace = this.value(data, param);
      newText = newText.replace(r, textToReplace);
    });
    return newText;
  }

  modifyTextNode({ el, data }) {
    const matchVars = el.textContent.match(/{{[a-zA-Z0-9.[\]\s_]+}}/gi);

    if (matchVars && el.nodeType === 3) {
      // eslint-disable-next-line
      el.textContent = this.replaceMustache({ text: el.textContent, data });
    }
  }

  deepParamChange(element, data, methods) {
    const recChange = (el, tmp = []) => {
      if (tmp.indexOf(el) >= 0) return;
      tmp.push(el);
      // console.log(el);

      this.modifyElementNode({ el, data, methods });
      this.modifyTextNode({ el, data });

      if (el.childNodes)
        Array.from(el.childNodes).forEach(child => recChange(child, tmp));

      if (el.tagName === 'COMPONENT') {
        const dataChild = el.attributes.data
          ? this.value(data, el.attributes.data.value)
          : data;
        const page = el.attributes.page.value;
        let goInside = true;
        if (Reflect.has(el.attributes, 'if')) {
          const modif = this.value(data, el.attributes.if.value);
          // console.log(el.attributes.if.value, modif);
          if (modif === undefined)
            throw new Error(`No such field in data ${el.attributes.if.value}`);
          goInside = modif;
        }

        if (goInside) {
          if (Reflect.has(el.attributes, 'foreach')) {
            Object.keys(dataChild).forEach(key => {
              const newChild = this.createNodeFromTemplate(
                page,
                dataChild[key],
                methods,
              );
              el.parentElement.insertBefore(newChild, el);
            });
            el.parentElement.removeChild(el);
          } else {
            const newChild = this.createNodeFromTemplate(
              page,
              dataChild,
              methods,
            );
            el.parentElement.replaceChild(newChild, el);
          }
        }
      }
    };
    recChange(element);
  }

  createNodeFromTemplate(name, data, methods) {
    if (!Reflect.has(this.HTMLSource, name)) {
      throw new Error(`No such template ${name}`);
    }
    const el = this.HTMLSource[name];
    if (!el.converted) {
      el.converted = true;
      let tag = el.sourceHTML.match(/[<].+([>]|[\s])/)[0];
      tag = tag
        .replace('<', '')
        .replace('>', '')
        .trim();
      switch (tag) {
        case 'div':
          tag = 'div';
          break;
        case 'tr':
          tag = 'tbody';
          break;
        default:
          tag = 'div';
          break;
      }
      const elem = document.createElement(tag);

      elem.innerHTML = el.sourceHTML;
      // console.log(elem);
      el.node = elem.firstElementChild;
    }
    // console.log(this.HTMLSource[name]);
    const copy = this.HTMLSource[name].node.cloneNode(true);
    this.deepParamChange(copy, data, methods);
    return copy;
  }

  appendNodeFromTemplate(pageName, parent, data, methods) {
    parent.appendChild(this.createNodeFromTemplate(pageName, data, methods));
  }

  render({ pageName, model, controller }) {
    this.HTMLRoot.innerHTML = '';
    this.appendNodeFromTemplate(
      pageName,
      this.HTMLRoot,
      model.data,
      controller.methods,
    );
  }

  createRenderFunction({ model, controller }) {
    return pageName => {
      this.render({ pageName, model, controller });
    };
  }
}

// ----------------------------
// ----------ROUTER------------
// ----------------------------

// eslint-disable-next-line
class Router {
  constructor(routerMap = []) {
    this.routerID = Symbol('routerID');
    this.currentPage = '';
    this.startUpdating = false;
    this.routerMap = routerMap.map(
      ({ pathname, model, startPage, controller, beforeRender }) => ({
        pathname,
        model,
        controller,
        startPage: Boolean(startPage),
        render: () => {},
        beforeRender:
          beforeRender ||
          ((_, cb) => {
            cb();
          }),
      }),
    );

    this.startPage = this.routerMap.find(x => x.startPage);
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

  refresh() {
    this.route(this.currentPage, false);
  }

  goToStartPage() {
    // console.log('test', this.startPage.pathname);
    // this.route
    this.route(this.startPage.pathname, true);
    // this.startPage.render();
  }
  route(href, history = true, callback = () => {}) {
    this.startUpdating = true;
    const parse = this.parseURL(href);
    // console.log(parse);
    const page = this.routerMap.find(x => x.pathname === parse.pathname);
    if (page === undefined) return;
    page.model.data.params = parse.params;
    const cb = () => {
      const renderPage = () => {
        if (history) {
          window.history.pushState({ href }, page.title, href);
        }
        this.currentPage = href;
        page.render();
        // console.log('render');
        this.startUpdating = false;
        callback();
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

// ----------------------------
// --------CONTROLLER----------
// ----------------------------
// eslint-disable-next-line
class Controller {
  constructor(methods, model) {
    this.methods = methods;
    this.methods._model = model;
    this.methods._route = (...e) => {
      console.log(...e);
    };
  }
  // eslint-disable-next-line
  // beforeRender(model) {
  //   console.log(model.params);
  // }
}

// ----------------------------
// ----------MODEL-------------
// ----------------------------

// eslint-disable-next-line
class Storage {
  constructor(inputData) {
    const mainData = {};
    const _mainData = {};

    // document.addEventListener('DOMContentLoaded', onLoad);

    // -----------test mode
    // window.localStorage.clear();
    // -----------test mode

    this.mainData = mainData;
    this._mainData = _mainData;
    Object.keys(inputData).forEach(key => {
      if (Reflect.has(window.localStorage, key)) {
        this._mainData[key] = JSON.parse(window.localStorage.getItem(key));
        // console.log('charge');
      } else {
        const json = JSON.stringify(inputData[key]);
        window.localStorage.setItem(key, json);
        this._mainData[key] = JSON.parse(json);
        // console.log('key');
      }

      Object.defineProperty(mainData, key, {
        get() {
          return _mainData[key];
        },
        set(val) {
          const json = JSON.stringify(val);
          // console.log('set', key);
          window.localStorage.setItem(key, json);
          _mainData[key] = JSON.parse(json);
        },
        enumerable: true,
        configurable: true,
      });
    });

    window.addEventListener('storage', () => {
      this.loadFromStorage();
      if (
        Reflect.has(this, '_router') &&
        this._router.startUpdating === false
      ) {
        // console.log('refresh');
        this._router.refresh();
      }
    });
  }

  loadFromStorage() {
    Object.keys(this._mainData).forEach(key => {
      if (Reflect.has(window.localStorage, key)) {
        // console.log('update', key);
        this._mainData[key] = JSON.parse(window.localStorage.getItem(key));
      }
    });
  }
}

// eslint-disable-next-line
class Model {
  constructor(data, storage = null) {
    this.data = data;
    let ok;
    this._isLocalChecked = new Promise(res => (ok = res));
    if (storage) {
      this.storage = storage;
      this.storage._localResolve = ok;
      // window.addEventListener('DOMContentLoaded', () => {
      ok();
      // });
      this.data.mainData = storage.mainData;
    }
  }
}
