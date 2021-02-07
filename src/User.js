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

  async refreshToken() {
    const { refreshToken } = require('./oauth');
    this._token = await refreshToken(this._token.email, this._token.refresh_token);
    return this._token;
  }

  async logout() {
    return this.httpPost('/oauth/revoke', { token: this._token.access_token });
  }

  async listVehicles() {
    const { response: vehicles } = await this.httpGet('/api/1/vehicles');
    return vehicles.map(v => new Vehicle(this, v));
  }

  httpGet(path, { headers, ...cfg } = {}) {
    return get(path, { ...cfg, headers: { ...headers, ...this.authorization } });
  }

  httpPost(path, body, { headers, ...cfg } = {}) {
    return post(path, body, { ...cfg, headers: { ...headers, ...this.authorization } });
  }
}

module.exports = User;