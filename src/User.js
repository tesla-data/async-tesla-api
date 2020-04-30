const {} = require('./request');

class User {
  constructor(token) {
    this._token = token;
  }

  get token() {
    return this._token;
  }

  listVehicles() {

  }
}

module.exports = User;