// single source of truth

function value(inObj, inPath, sliceFirst = false, first = true) {
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
    return value(inObj, newPath, false, false);
  }
  if (inPath.length === 0) return inObj;
  if (!Reflect.has(inObj, inPath[0]))
    throw new Error(`Parsing error ${inPath[0]}`);
  return value(inObj[inPath[0]], inPath.slice(1), false, false);
}

// const a = { b: { c: 5, d: [{ l: [1, 2, 3] }, {}, {}, { p: 1 }, { z: 2 }] } };

// console.log(value(a, 'b.d[0].l'));

const STATE = {
  data: {
    login: 'userlogin',
    userName: 'Andrei',
    contacts: { phone: '123123', email: 'asdfasdf' },
    articles: [{ name: 'data1' }, { name: 'data2' }],
    currentArticle: {},
  },
  HTMLSource: {},
  HTMLRoot: document.getElementById('app'),
  currentRoute: 'main',
  routes: {
    main: { name: 'main', params: {} },
  },
  load() {
    const arr = Array.from(
      document.getElementById('application_hidden_layer').children,
    );
    arr.forEach(html => {
      this.HTMLSource[html.className] = html;
    });
  },
  deepParamChange(element, data = this.data) {
    const recChange = (el, tmp = []) => {
      if (tmp.indexOf(el) >= 0) return;
      tmp.push(el);

      // console.log(el);
      let matchVars = el.textContent.match(/{{[a-zA-Z0-9\.[\]\s_]+}}/gi);
      if (matchVars) {
        matchVars = matchVars.map(str =>
          str
            .replace('{{', '')
            .replace('}}', '')
            .trim(),
        );
        let { textContent } = el;
        matchVars.forEach(param => {
          // if (Reflect.has(data, param)) {
          const r = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
          textContent = textContent.replace(r, value(data, param));
          // }
        });
        el.textContent = textContent;
      }
      if (el.children.length)
        Array.from(el.children).forEach(child => recChange(child, tmp));
      if (el.tagName === 'COMPONENT') {
        const dataChild = el.attributes.data
          ? value(this.data, el.attributes.data.value)
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
  },
  createNodeFromTemplate(name, data = this.data) {
    if (!Reflect.has(STATE.HTMLSource, name))
      throw new Error(`No such template ${name}`);
    const copy = this.HTMLSource[name].cloneNode(true);
    this.deepParamChange(copy, data);
    return copy;
  },
  appendNodeFromTemplate(name, parent = this.HTMLRoot, data = this.data) {
    parent.appendChild(this.createNodeFromTemplate(name, data));
  },
}; // MAIN STATE OF APPLICATION

STATE.load();

function render(state) {
  state.data.currentArticle = state.data.articles[1];
  state.appendNodeFromTemplate('main');
}
render(STATE);
// console.log(STATE.HTMLSource);
