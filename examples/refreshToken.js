const { User } = require('async-tesla-api');

(async function () {
  const user = new User(require('./user.json'));
  console.log(await user.refreshToken());
  require('fs').writeFileSync(__dirname + '/user.json', JSON.stringify(user.token));
})();