const { oauth: { login } } = require('async-tesla-api');

(async function () {
  const user = await login(process.env.EMAIL, process.env.PASSWORD);
  console.log(user.token);
  require('fs').writeFileSync(__dirname + '/user.json', JSON.stringify(user.token));
})().catch(console.error);