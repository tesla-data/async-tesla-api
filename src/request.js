const axios = require('axios');

module.exports = {
  urlBase: 'https://owner-api.teslamotors.com',

  async get(path, cfg) {
    const { data } = await axios.get(module.exports.urlBase + path, cfg);
    return data;
  },

  async post(path, body, cfg = {}) {
    const { data } = await axios.post(module.exports.urlBase + path, body, { ...cfg, headers: { ...cfg.headers, 'Content-Type': 'application/json' } });
    return data;
  }
};
