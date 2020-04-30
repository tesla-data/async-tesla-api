const { User } = require('async-tesla-api');

(async function () {
  const user = new User(require('./user.json'));
  const vehicles = await user.listVehicles();

  if (vehicles.length > 0) {
    const v = vehicles[0];

    console.log('Waking up vehicle.');
    await v.wakeUp();
    console.log('Vehicle: ', v.data);
    console.log(await v.isMobileEnabled());
    console.log(await v.getStatus());
  }
})();