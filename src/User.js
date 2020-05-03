const { get, post } = require('./request');
const Vehicle = require('./Vehicle');

class User {
  constructor(token) {
    this._token = token;
  }

  get token() {
    return this._token;
  }

  get authorization() {
    return { Authorization: 'Bearer ' + this._token.access_token };
  }

  async logout() {
    return this.httpPost('/oauth/revoke', { token: this._token.access_token });
  }

  async listVehicles() {
    const { response: vehicles } = await this.httpGet('/api/1/vehicles');
    return vehicles.map(v => new Vehicle(this, v));
  }

  httpGet(path, cfg = {}) {
    return get(path, { ...cfg, headers: { ...cfg.headers, ...this.authorization } });
  }

  httpPost(path, body, cfg = {}) {
    return post(path, body, { ...cfg, headers: { ...cfg.headers, ...this.authorization } });
  }
}

module.exports = User;