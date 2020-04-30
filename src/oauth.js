const { post } = require('./request');
const User = require('./User');

module.exports = {
  async login(email, password, grant_type = 'password', client_secret = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3', client_id = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384') {
    const token = await post('/oauth/token', { password, email, grant_type, client_secret, client_id });
    return new User({ email, ...token });
  }
};