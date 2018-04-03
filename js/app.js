class ApplicationState {
  constructor({ data, hiddenId, appId, routes }) {
    // super();
    this.data = data;
    this.routes = routes;
    this.HTMLSource = {};
    this.methods = {};
    this.HTMLRoot = document.getElementById(appId);
    this.routerCurrentPage = 'main-router';
    this.load();
  }
  // eslint-disable-next-line
  value(inObj, inPath, sliceFirst = false, first = true) {
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
      return this.value(inObj, newPath, false, false);
    }
    if (inPath.length === 0) return inObj;
    if (!Reflect.has(inObj, inPath[0]))
      throw new Error(`Parsing error ${inPath[0]}`);
    return this.value(inObj[inPath[0]], inPath.slice(1), false, false);
  }

  load() {
    window.addEventListener('hashchange', e => this.router(e));
    window.addEventListener('load', e => {
      this.router({ newURL: window.location.href });
    });

    const arr = Array.from(document.getElementsByTagName('script'))
      .filter(el => el.id.match(/^template_/) && el.type === 'text/template')
      .map(el => ({
        name: el.id.replace('template_', ''),
        sourceHTML: el.innerHTML,
        node: null,
        converted: false,
      }));
    arr.forEach(el => {
      this.HTMLSource[el.name] = el;
    });
  }
  router(e) {
    const urlArr = e.newURL.split('#');
    if (urlArr.length === 1) this.routerCurrentPage = this.routes.main;
    else {
      const url = urlArr[1].split('&')[0];
      // console.log(url);
      if (Reflect.has(this.routes, url)) {
        this.routerCurrentPage = this.routes[url];
      } else {
        this.routerCurrentPage = this.routes.main;
      }
      this.data.params = window.location.hash
        .replace('#', '')
        .split('&')
        .map(x => x.split('='))
        .reduce((a, b) => {
          a[b[0]] = b[1]; // eslint-disable-line
          return a;
        }, {});
    }
    this.render();
  }

  deepParamChange(element, data = this.data) {
    const recChange = (el, tmp = []) => {
      if (tmp.indexOf(el) >= 0) return;
      tmp.push(el);

      let matchVars = el.textContent.match(/{{[a-zA-Z0-9.[\]\s_]+}}/gi);

      if (el.nodeType !== 3 && el.attributes) {
        Object.keys({ ...el.attributes }).forEach((key, val) => {
          const attName = el.attributes[key].name;
          if (attName.indexOf(':') >= 0) {
            const newKey = attName.replace(':', '');
            el.setAttribute(newKey, this.value(data, el.attributes[key].value));
          }

          if (attName.indexOf('@click') >= 0) {
            el.addEventListener(
              'click',
              this.methods[el.attributes[key].value],
            );
          }
        });
      }
      if (matchVars && el.nodeType === 3) {
        matchVars = matchVars.map(str =>
          str
            .replace('{{', '')
            .replace('}}', '')
            .trim(),
        );
        let { textContent } = el;
        matchVars.forEach(param => {
          const r = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
          textContent = textContent.replace(r, this.value(data, param));
        });
        // eslint-disable-next-line
        el.textContent = textContent;
      }
      if (el.childNodes)
        Array.from(el.childNodes).forEach(child => recChange(child, tmp));
      if (el.tagName === 'COMPONENT') {
        const dataChild = el.attributes.data
          ? this.value(this.data, el.attributes.data.value)
          : this.data;
        const page = el.attributes.page.value;

        if (Reflect.has(el.attributes, 'foreach')) {
          Object.keys(dataChild).forEach(key => {
            const newChild = this.createNodeFromTemplate(page, dataChild[key]);
            el.parentElement.insertBefore(newChild, el);
          });
          el.parentElement.removeChild(el);
        } else {
          const newChild = this.createNodeFromTemplate(page, dataChild);
          el.parentElement.replaceChild(newChild, el);
        }
      }
    };
    recChange(element);
  }

  createNodeFromTemplate(name, data = this.data) {
    if (!Reflect.has(this.HTMLSource, name))
      throw new Error(`No such template ${name}`);
    const el = this.HTMLSource[name];
    if (!el.converted) {
      el.converted = true;
      const div = document.createElement('div');
      div.innerHTML = el.sourceHTML;
      el.node = div.firstElementChild;
    }
    const copy = this.HTMLSource[name].node.cloneNode(true);
    this.deepParamChange(copy, data);
    return copy;
  }

  appendNodeFromTemplate(name, parent = this.HTMLRoot, data = this.data) {
    parent.appendChild(this.createNodeFromTemplate(name, data));
  }

  render() {
    this.HTMLRoot.innerHTML = '';
    this.appendNodeFromTemplate(this.routerCurrentPage);
  }
}

const data = {
  login: 'userlogin',
  userName: 'Andrei',
    temp:{a:{b:'test'}},
  contacts: { phone: '123123', email: 'asdfasdf' },
  articles,
  bannerList,
  menuItems,
  currentArticle: {},
};

const routes = {
  main: 'main',
  login: 'login',
  '404': '404',
  register: 'register',
};

const STATE = new ApplicationState({
  data,
  routes,
  hiddenId: 'application_hidden_layer',
  appId: 'app',
});

STATE.methods.showClick = () => {
  alert('test');
};
