/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process');

const runCommand = async function (command, statusUpdate) {
  return new Promise((resolve, reject) => {
    if (statusUpdate) {
      console.log(statusUpdate);
    }

    exec(command, (err, stdout, stderr) => {
      if(err || stderr) {
        const errCombined = [err, stderr].join('');
        console.error('Error while running command', command, errCombined);
        reject(errCombined);
      }

      console.log('command ran successfully', command, stdout);
      resolve(stdout);
    });
  });
};

module.exports = {
  runCommand
};
