// ----------------------------
// ------APPLICATION-----------
// ----------------------------

// eslint-disable-next-line
class Application {
  constructor({ view, router, beginFromStartPage, version }) {
    let isMainPage = false;
    let startPageRoute;
    this.applicationVersion = version;
    this.libraryVersion = '1.0.1';
    // eslint-disable-next-line
    view._app = this;
    this.router = router;
    router.routerMap.forEach(route => {
      const { model, controller, pathname, startPage } = route;
      if (startPage) {
        if (isMainPage) throw new Error('More than one start page');
        isMainPage = true;
        startPageRoute = pathname;
      }
      // eslint-disable-next-line
      controller.methods._view = view;
      // eslint-disable-next-line
      model._router = router;
      // eslint-disable-next-line
      if (model.storage) {
        model.storage._router = router;
      }
      // eslint-disable-next-line
      route.render = () =>
        view.createRenderFunction({ model, controller })(pathname);
      controller.methods._route = router.startRouting(view);
      controller.methods._router = router;
    });
    if (beginFromStartPage) {
      // console.log('test 0');
      // const displayBefore = view.HTMLRoot.style.visibility;
      const displayBefore = '';
      if (!startPageRoute) throw new Error('You have to select startPage');
      // eslint-disable-next-line
      view.HTMLRoot.style.visibility = 'hidden';
      const destination = window.location.href;
      startPageRoute = `${window.location.protocol}//${
        window.location.hostname
      }${
        // eslint-disable-next-line
        window.location.port ? ':' + window.location.port : ''
      }${startPageRoute}`;

      // console.log(startPageRoute);
      router.route(startPageRoute, false, () => {
        // console.log('test cb 1');
        router.route(destination, false, () => {
          // console.log('test cb 2');
          // eslint-disable-next-line
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
    // console.log(this);
    this.DOMreferences = {};
    this.options.idPattrnRegExp = new RegExp(this.options.idPattrn);
    if (appId) {
      this.HTMLRoot = document.getElementById(appId);
    } else {
      this.HTMLRoot = document.querySelector(main);
    }

    this.looseFocusArray = [];

    document.addEventListener(
      'click',
      e => {
        // console.log(window.location.href);
        if (!this._app.router.startUpdating) {
          const path = Array.from(e.path);
          this.looseFocusArray.forEach(({ element, func }) => {
            if (path.indexOf(element) === -1) func();
          });
        }
      },
      true,
    );

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
    let preventDefaultFlag = false;
    let outsideLink = false;

    if (el.nodeType !== 3 && el.attributes) {
      Object.keys({ ...el.attributes }).forEach(key => {
        const attName = el.attributes[key].name;
        const param = el.attributes[key].value;

        // changed elements
        if (attName.indexOf(':') >= 0) {
          const newKey = attName.replace(':', '');
          let newVal;

          if (param.indexOf('{{') >= 0) {
            newVal = this.replaceMustache({ text: param, data });
          } else if (newKey !== 'ref') {
            newVal = this.value(data, param);
          }

          if (newKey === 'ref') {
            this.DOMreferences[newVal || param] = el;
          } else {
            el.setAttribute(newKey, newVal);
          }
        }

        // prevent default
        if (attName === 'prevent-default') preventDefaultFlag = true;
        if (attName === 'outside') outsideLink = true;

        // working with model
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

        // IF atribute
        if (attName === 'if') {
          const modif = this.value(data, param);
          // eslint-disable-next-line
          if (!modif) el.style.display = 'none';
        }

        // click atribute
        // if (attName.indexOf('@blurout') >= 0) {
        //   const paramName = el.attributes[key].value;
        // }

        if (
          attName.indexOf('@') >= 0
          // attName.indexOf('@click') >= 0 ||
          // attName.indexOf('@keydown') >= 0
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

            if (!Reflect.has(methods, methodName)) {
              throw new Error(`No such method ${methodName}`);
            }
            const funcToEval = e => {
              const evalParams = params.map(p => this.value(data, p));
              methods[methodName](...evalParams, e);
            };

            if (eventMethod !== 'blurout') {
              el.addEventListener(eventMethod, e => {
                if (preventDefaultFlag) e.preventDefault();
                setTimeout(() => funcToEval(e), 0);
              });
            } else {
              this.looseFocusArray.push({
                element: el,
                func: funcToEval,
              });
            }
          } else {
            if (!Reflect.has(methods, paramName)) {
              throw new Error(`No such method ${paramName}`);
            }
            if (eventMethod !== 'blurout') {
              el.addEventListener(eventMethod, e => {
                if (preventDefaultFlag) {
                  e.preventDefault();
                }
                methods[paramName](e);
              });
            } else {
              this.looseFocusArray.push({
                element: el,
                func: () => methods[paramName](),
              });
            }
          }
        }
      });
    }

    if (el.tagName === 'A') {
      if (!outsideLink) {
        el.addEventListener('click', e => {
          e.preventDefault();
          if (!preventDefaultFlag) methods._route(el.href, e);
        });
      }
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

  deepParamChange(
    element,
    data,
    methods,
    tmpIn = [],
    optionsIn = {
      ifStart: false,
      ifBool: false,
      idEl: 0,
      ifStartId: 0,
    },
  ) {
    const recChange = (el, tmp) => {
      const defaultOptions = () => ({
        ifStart: false,
        ifBool: false,
        idEl: 0,
        ifStartId: 0,
      });
      const optionsForNodesIn = optionsIn;
      if (el.nodeType !== 3) {
        optionsForNodesIn.idEl += 1;
      }
      if (tmp.indexOf(el) >= 0) return;
      tmp.push(el);
      let dataChild = data;
      const isObjectAtrr =
        typeof el.attributes === 'object' && el.attributes !== null;
      if (isObjectAtrr && Reflect.has(el.attributes, 'data')) {
        dataChild = el.attributes.data
          ? this.value(data, el.attributes.data.value)
          : data;
      }

      let goInside = true;
      if (isObjectAtrr && Reflect.has(el.attributes, 'if')) {
        optionsForNodesIn.ifStart = true;
        optionsForNodesIn.ifStartId = optionsForNodesIn.idEl;
        const modif = this.value(data, el.attributes.if.value);
        if (modif === undefined)
          throw new Error(`No such field in data ${el.attributes.if.value}`);
        optionsForNodesIn.ifBool = modif;
        goInside = optionsForNodesIn.ifBool;
      }

      if (isObjectAtrr && Reflect.has(el.attributes, 'else')) {
        if (!optionsForNodesIn.ifStart)
          throw new Error('expected if-node first statement in template');
        if (optionsForNodesIn.ifStartId !== optionsForNodesIn.idEl - 1)
          throw new Error('expected else-node after if statement in template');
        optionsForNodesIn.ifStart = false;
        if (optionsForNodesIn.ifBool) {
          goInside = false;
        }
      }

      if (!goInside) {
        el.parentElement.removeChild(el);
        return;
      }

      if (isObjectAtrr && Reflect.has(el.attributes, 'foreach')) {
        if (el.tagName === 'COMPONENT') {
          const page = el.attributes.page.value;
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
          el.removeAttribute('foreach');
          el.removeAttribute('data');
          const optionsForNodes = defaultOptions();
          Object.keys(dataChild).forEach(key => {
            const newChild = el.cloneNode(true);
            this.deepParamChange(
              newChild,
              dataChild[key],
              methods,
              tmp,
              optionsForNodes,
            );
            el.parentElement.insertBefore(newChild, el);
          });
          el.parentElement.removeChild(el);
        }
      } else {
        this.modifyElementNode({ el, data: dataChild, methods });
        this.modifyTextNode({ el, data: dataChild });
        if (el.childNodes) {
          const optionsForNodes = defaultOptions();
          Array.from(el.childNodes).forEach(child =>
            this.deepParamChange(
              child,
              dataChild,
              methods,
              tmp,
              optionsForNodes,
            ),
          );
        }
        if (el.tagName === 'COMPONENT') {
          const page = el.attributes.page.value;
          const newChild = this.createNodeFromTemplate(
            page,
            dataChild,
            methods,
          );
          el.parentElement.replaceChild(newChild, el);
        }
      }
    };
    recChange(element, tmpIn);
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
        .trim()
        .split(' ')[0]
        .toUpperCase();

      const allowedRootElements = [
        'DIV',
        'MAIN',
        'HEADER',
        // 'FORM',
        'FOOTER',
        'LI',
        'UL',
      ];
      if (allowedRootElements.indexOf(tag) === -1) {
        throw new Error(
          `allowed root elements: ${allowedRootElements.join()}. Page "${name}" tag "${tag}"`,
        );
      }
      const elem = document.createElement(tag);
      // console.log(el.sourceHTML);

      elem.innerHTML = el.sourceHTML;
      // console.log(elem);

      if (elem.childElementCount !== 1)
        throw new Error(`page "${name}" can have only one root `);
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
    this.looseFocusArray = [];

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
      ({ pathname, model, startPage, controller, beforeRender ,title}) => ({
        pathname,
        model,
        controller,
        title,
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
        window.document.title = page.title;
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
  constructor(inputData, applicationVersion) {
    const mainData = {};
    const _mainData = {};
    this.applicationVersion = applicationVersion;

    // document.addEventListener('DOMContentLoaded', onLoad);

    // -----------test mode
    if (window.localStorage.getItem('version') !== this.applicationVersion) {
      window.localStorage.clear();
      window.localStorage.setItem('version', this.applicationVersion);
    }
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
    // eslint-disable-next-line
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
