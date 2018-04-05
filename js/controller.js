// eslint-disable-next-line
class Controller {
  constructor(methods) {
    this.methods = methods;
    this.methods._route = (...e) => {
      console.log(...e);
    };
  }
}
