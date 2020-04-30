
class Vehicle {
  constructor(user, data) {
    this._user = user;
    this._data = data;
  }

  get data() {
    return this._data;
  }

  async wakeUp() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/wake_up`);
    this._data = response;
  }

  async isMobileEnabled() {
    const { response } = await this._user.httpGet(`/api/1/vehicles/${this.data.id_s}/mobile_enabled`);
    return response;
  }

  async getStatus() {
    const { response } = await this._user.httpGet(`/api/1/vehicles/${this.data.id_s}/vehicle_data`);
    return response;
  }
}

module.exports = Vehicle;