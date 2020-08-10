const { User } = require('async-tesla-api');

(async function () {
  const user = new User(require('./user.json'));
  const vehicles = await user.listVehicles();

  if (vehicles.length > 0) {
    const v = vehicles[0];

    v.on('data:update', console.log);
    v.on('data:error', console.log);
    v.on('close', () => console.log('Socket closed.'));
    v.on('data:disconnected', () => {
      console.log('data:disconnected, re-fetch in 100 seconds...');
      setTimeout(() => v.startStreaming(), 100000);
    });

    await v.wakeUp();
    console.log('waked up');
    await v.wsConnect();
    await v.startStreaming();
  }
})();