const { User } = require('async-tesla-api');

(async function () {
  const user = new User(require('./user.json'));
  const vehicles = await user.listVehicles();

  if (vehicles.length > 0) {
    const v = vehicles[0];

    v.on('data:update', console.log);
    v.on('data:error', console.log);
    v.on('data:disconnected', () => {
      console.log('data:disconnected, re-fetch in 10 seconds...');
      setTimeout(() => v.startStreaming(), 10000);
    });

    await v.wakeUp();
    console.log('waked up');
    await v.wsConnect();
    await v.startStreaming();
  }
})();