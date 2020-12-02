const _ = require('lodash');
const WebSocket = require('async-ws');
const { EventEmitter } = require('events');

const fields = 'speed,odometer,soc,elevation,est_heading,est_lat,est_lng,power,shift_state,range,est_range,heading';
async function parseBlob(blob) {
  return await new Promise(resolve => {
    const reader = new window.FileReader();
    reader.readAsText(blob);
    reader.onloadend = () => resolve(JSON.parse(reader.result));
  });
}

class Vehicle extends EventEmitter {
  constructor(user, data) {
    super();

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

  async isOnline() {
    const { state } = await this.getBasicInfo();
    return state === 'online';
  }

  async getBasicInfo() {
    const { response } = await this._user.httpGet(`/api/1/vehicles/${this.data.id_s}`);
    return response;
  }

  async getState() {
    const { response } = await this._user.httpGet(`/api/1/vehicles/${this.data.id_s}/vehicle_data`, { retryWait: 3000 });
    return response;
  }

  /* just for test  */
  async wsConnect() {
    this._wsConn = new WebSocket(
      `wss://streaming.vn.teslamotors.com/connect/${this.data.vehicle_id}`,
      {
        autoReconnect: false,
        options: {
          headers: this._user.authorization
        }
      }
    );

    this._wsConn.on('message', async evt => {
      const data = Buffer.isBuffer(evt) ? JSON.parse(evt.toString()) : await parseBlob(evt.data);
      console.log(data);
    });

    await this._wsConn.ready();
  }

  async startStreaming() {
    if (!this._ws) {
      this._ws = new WebSocket('wss://streaming.vn.teslamotors.com/streaming/', { autoReconnect: false });
      this._ws.on('close', () => this.emit('data:closed'));
      this._ws.on('message', async evt => {
        const data = Buffer.isBuffer(evt) ? JSON.parse(evt.toString()) : await parseBlob(evt.data);
        switch (data.msg_type) {
          case 'data:update':
            this.emit('data:update', _.zipObject(['ts', ...fields.split(',')], data.value.split(',')));
            break;
          case 'data:error':
            if (data.error_type === 'vehicle_disconnected') {
              this.emit('data:disconnected');
            } else {
              this.emit('data:error', data);
            }
            break;
        }
      });
    }

    await this._ws.send(JSON.stringify({
      // msg_type: 'data:subscribe',
      // token: Buffer.from(`${this._user.token.email}:${this.data.tokens[0]}`).toString('base64'),
      msg_type: 'data:subscribe_oauth',
      token: this._user.token.access_token,
      value: fields,
      tag: this.data.vehicle_id.toString()
    }));
  }

  /* homelink, speed limit, sunroof, media */

  async honkHorn() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/honk_horn`);
    return response;
  }

  async flashLights() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/flash_lights`);
    return response;
  }

  async remoteStartDrive(password) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/remote_start_drive`, { password });
    return response;
  }

  async triggerHomelink(lat, lon) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/trigger_homelink`, { lat, lon });
    return response;
  }

  async setValetMode(on, pin) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/set_valet_mode`, { on, password: pin });
    return response;
  }

  async resetValetPin() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/reset_valet_pin`);
    return response;
  }

  async setSentryMode(on) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/set_sentry_mode`, { on });
    return response;
  }

  async unlockDoor() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/door_unlock`);
    return response;
  }

  async lockDoor() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/door_lock`);
    return response;
  }

  async actuateTrunk() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/actuate_trunk`, { which_trunk: 'rear' });
    return response;
  }

  async actuateFrunk() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/actuate_trunk`, { which_trunk: 'front' });
    return response;
  }

  async ventWindows(lat = 0, lon = 0) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/window_control`, { command: 'vent', lat, lon });
    return response;
  }

  async closeWindows(lat = 0, lon = 0) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/window_control`, { command: 'close', lat, lon });
    return response;
  }

  async openChargePort() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_port_door_open`);
    return response;
  }

  async closeChargePort() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_port_door_close`);
    return response;
  }

  async startCharge() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_start`);
    return response;
  }

  async stopCharge() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_stop`);
    return response;
  }

  async setChargeStandard() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_standard`);
    return response;
  }

  async setChargeMaxRange() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/charge_max_range`);
    return response;
  }

  async setChargeLimit(percent) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/set_charge_limit`, { percent });
    return response;
  }

  async acStart() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/auto_conditioning_start`);
    return response;
  }

  async acStop() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/auto_conditioning_stop`);
    return response;
  }

  async setTemps(driver_temp, passenger_temp = driver_temp) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/set_temps`, { driver_temp, passenger_temp });
    return response;
  }

  async setPreconditioningMax(on) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/set_preconditioning_max`, { on });
    return response;
  }

  async remoteSeatHeaterRequest(heater, level) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/remote_seat_heater_request`, { heater, level });
    return response;
  }

  async remoteSteeringWheelHeaterRequest(on) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/remote_steering_wheel_heater_request`, { on });
    return response;
  }

  async share(locale = 'en-US', value) {
    const { response } = await this._user.httpPost(
      `/api/1/vehicles/${this.data.id_s}/command/share`,
      {
        type: 'share_ext_content_raw',
        locale,
        timestamp_ms: `${Math.round(Date.now() / 1000)}`,
        value: {
          'android.intent.extra.TEXT': value
        }
      });
    return response;
  }

  async scheduleSoftwareUpdate(offset_sec = 0) {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/schedule_software_update`, { offset_sec });
    return response;
  }

  async cancelSoftwareUpdate() {
    const { response } = await this._user.httpPost(`/api/1/vehicles/${this.data.id_s}/command/cancel_software_update`);
    return response;
  }
}

module.exports = Vehicle;