const url = require('url');
const qs = require('querystring');
const axios = require('axios');
const crypto = require('crypto');
const hash = require('hash-util');

const { post } = require('./request');
const User = require('./User');

async function parseLoginPage(email) {
  const code_verifier = crypto.randomBytes(43).toString('hex');
  const code_challenge = hash.sha256(code_verifier, 'base64');

  const loginPage = await axios.get('https://auth.tesla.com/oauth2/v3/authorize', {
    params: {
      client_id: 'ownerapi',
      login_hint: email,
      code_challenge,
      code_challenge_method: 'S256',
      redirect_uri: 'https://auth.tesla.com/void/callback',
      response_type: 'code',
      scope: 'openid email offline_access',
      state: '200'
    }
  });

  const { request: { connection: { servername } } } = loginPage;
  const cookies = loginPage.headers['set-cookie']
    .map(c => /.+?=.*?;/ig.exec(c)[0])
    .join(' ');
  const { data: body } = loginPage;
  const hiddenInputs =
    [...body.matchAll(/<input type="hidden" name="(.+?)" value="(.*?)"/ig)]
      .map(([, name, value]) => ({ name, value }));

  return {
    servername,
    code_verifier,
    code_challenge,
    cookies,
    hiddenInputs
  };
}

async function exchangeToken(token) {
  const { access_token, token_type, expires_in, created_at } = await post('/oauth/token', {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id: '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384',
    client_secret: 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3'
  }, {
    headers: {
      Authorization: 'Bearer ' + token.access_token
    }
  });

  return { access_token, token_type, expires_in, created_at };
}

module.exports = {
  async login(email, password) {
    const { servername, code_verifier, code_challenge, cookies, hiddenInputs } = await parseLoginPage(email);

    const authorizeRes = await axios.post(`https://${servername}/oauth2/v3/authorize`, qs.stringify({
      ...hiddenInputs.reduce((m, { name, value }) => ({ ...m, [name]: value }), {}),
      identity: email,
      credential: password
    }), {
      maxRedirects: 0,
      validateStatus: status => status === 302,
      headers: {
        cookie: cookies,
        'content-type': 'application/x-www-form-urlencoded'
      },
      params: {
        client_id: 'ownerapi',
        login_hint: email,
        code_challenge,
        code_challenge_method: 'S256',
        redirect_uri: 'https://auth.tesla.com/void/callback',
        response_type: 'code',
        scope: 'openid email offline_access',
        state: '200'
      }
    });
    const { headers: { location } } = authorizeRes;
    const { code } = qs.parse(url.parse(location).query);

    const { data: token } = await axios.post(`https://${servername}/oauth2/v3/token`, {
      grant_type: 'authorization_code',
      client_id: 'ownerapi',
      code,
      code_verifier,
      redirect_uri: 'https://auth.tesla.com/void/callback'
    });

    return new User({ email, ...token, ...await exchangeToken(token) });
  },

  async refreshToken(email, refresh_token) {
    const { servername } = await parseLoginPage(email);
    const { data: token } = await axios.post(`https://${servername}/oauth2/v3/token`, {
      grant_type: 'refresh_token',
      client_id: 'ownerapi',
      refresh_token,
      scope: 'openid email offline_access'
    });

    return { email, ...token, ...await exchangeToken(token) };
  }
};