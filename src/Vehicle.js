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

  async getStatus() {
    const { response } = await this._user.httpGet(`/api/1/vehicles/${this.data.id_s}/vehicle_data`);
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
}

module.exports = Vehicle;