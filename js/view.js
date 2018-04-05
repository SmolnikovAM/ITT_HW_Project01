// eslint-disable-next-line
class View {
  constructor(options = {}) {
    const {
      tag = 'script',
      idPattrn = '^template_',
      type = 'text/template',
      appId = 'app',
    } = options;

    this.options = {
      tag,
      idPattrn,
      type,
      appId,
    };
    this.options.idPattrnRegExp = new RegExp(this.options.idPattrn);

    this.HTMLRoot = document.getElementById(appId);
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

        if (el.tagName === 'INPUT' && attName.indexOf('model') >= 0) {
          const modif = this.value(data, param, false, true, true);
          // eslint-disable-next-line
          el.value = modif.get();
          el.addEventListener('keydown', () => {
            modif.set(el.value);
          });
        }

        if (attName.indexOf('@click') >= 0) {
          const paramName = el.attributes[key].value;

          const idx = paramName.indexOf('(');
          if (idx >= 0) {
            const methodName = paramName.slice(0, idx);
            const params = paramName
              .slice(idx)
              .replace(/[()\s]+/g, '')
              .split(',')
              .map(p => this.value(data, p));
            el.addEventListener('click', e =>
              methods[methodName](...params, e),
            );
          } else {
            if (Reflect.has(methods, paramName)) {
              throw new Error(`No such method ${paramName}`);
            }
            el.addEventListener('click', methods[paramName]);
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
      const r = new RegExp(`{{\\s*${param}\\s*}}`, 'g');
      newText = newText.replace(r, this.value(data, param));
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
      const div = document.createElement('div');
      div.innerHTML = el.sourceHTML;
      el.node = div.firstElementChild;
    }
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
