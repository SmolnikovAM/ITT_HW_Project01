// eslint-disable-next-line
class Storage {
  constructor(inputData) {
    const mainData = {};
    const _mainData = {};

    this.mainData = mainData;
    this._mainData = _mainData;
    Object.keys(inputData).forEach(key => {
      this._mainData[key] = inputData[key];
      if (Reflect.has(window.localStorage, 'key')) {
        this._mainData[key] = window.localStorage.getItem(key);
      }
      Object.defineProperty(mainData, key, {
        get() {
          return _mainData[key];
        },
        set(val) {
          window.localStorage.setItem(key, val);
          const valReturn = window.localStorage.getItem(key);
          _mainData[key] = valReturn;
        },
        enumerable: true,
      });
    });
  }

  loadFromStorage() {
    Object.keys(this._mainData).forEach(key => {
      if (Reflect.has(window.localStorage, 'key')) {
        this._mainData[key] = window.localStorage.getItem(key);
      }
    });
  }
}

// eslint-disable-next-line
class Model {
  constructor(data, storage = null) {
    this.data = data;
    if (storage) {
      this.storage = storage;
      this.data.mainData = storage.mainData;
    }
  }
}
