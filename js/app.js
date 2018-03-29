class ApplicationState {
  constructor({ data, hiddenId, appId }) {
    // super();
    this.data = data;
    this.HTMLSource = {};
    this.HTMLRoot = document.getElementById(appId);
    this.load(hiddenId);
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

  load(hiddenId) {
    const arr = Array.from(document.getElementById(hiddenId).children);
    arr.forEach(html => {
      this.HTMLSource[html.className] = html;
    });
  }

  deepParamChange(element, data = this.data) {
    const recChange = (el, tmp = []) => {
      if (tmp.indexOf(el) >= 0) return;
      tmp.push(el);

      // console.log(el);
      let matchVars = el.textContent.match(/{{[a-zA-Z0-9.[\]\s_]+}}/gi);
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
    const copy = this.HTMLSource[name].cloneNode(true);
    this.deepParamChange(copy, data);
    return copy;
  }

  appendNodeFromTemplate(name, parent = this.HTMLRoot, data = this.data) {
    parent.appendChild(this.createNodeFromTemplate(name, data));
  }
}

const data = {
  login: 'userlogin',
  userName: 'Andrei',
  contacts: { phone: '123123', email: 'asdfasdf' },
  articles,
  currentArticle: {},
};

const STATE = new ApplicationState({
  data,
  hiddenId: 'application_hidden_layer',
  appId: 'app',
});

function render(state) {
  state.data.currentArticle = state.data.articles[1];
  state.appendNodeFromTemplate('main-router');
}
render(STATE);
