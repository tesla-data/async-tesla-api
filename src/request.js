const _ = require('co-lodash');
const axios = require('axios');

function shouldRetry(e) {
  if (e.response) return e.response.status === 408;
  else return !!e.request;
}

async function exec(op, retry, retryWait) {
  try {
    return await op();
  } catch (e) {
    if (retry >= 0 && shouldRetry(e)) {
      await _.sleep(retryWait);
      return await exec(op, --retry, retryWait);
    } else {
      throw e;
    }
  }
}

module.exports = {
  urlBase: 'https://owner-api.teslamotors.com',

  async get(path, { retry = 3, retryWait = 1000,  ...cfg } = {}) {
    return await exec(async () => {
      const { data } = await axios.get(module.exports.urlBase + path, cfg);
      return data;
    }, retry, retryWait);
  },

  async post(path, body, { retry = 3, retryWait = 1000,  ...cfg } = {}) {
    return await exec(async () => {
      const { data } = await axios.post(module.exports.urlBase + path, body, { ...cfg, headers: { ...cfg.headers, 'Content-Type': 'application/json' } });
      return data;
    }, retry, retryWait);
  }
};
