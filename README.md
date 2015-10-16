# process-lock-node
A very simple process locking module using redis

This module allows you to spin up two instances of one process and
make sure that only one of them runs at a time.

```bash
npm install node-process-lock
```

## Usage
The following will create a process lock with the name of
`start_process`. It aslo sets the time out to 60 seconds (1 minute);

```javascript
var ProcessLock = require('node-process-lock');

processLock = new ProcessLock('start_process', 60)

// keep trying to get the lock every 60 seconds

var attemptToGetLock = setInterval(function(){
  processLock.lock(function() {

    if (!processLock.owner) {
      // failed to get lock
      return;
    }

    startProcess();

  });
}, 600000);



function startProcess() {
  // stop attempting to get the lock

  clearInterval(attemptToGetLock);

  // make sure you tell your running process to keep updating
  // or else the second process will think that the first process
  // crashed and will attempt to take over

  // It's recommended that you set your processLock update to be
  // half the time for the timeout. This way the lock is always updated
  // In this case its 30 seconds

  var keepLock = setInterval(function() {
    processLock.update();
  }, 30000)

  // The rest of the process...
};
```

#### Methods

* `lock`
- obtains the lock if another process doesnt already have it


* `update`
- updates the lock only if you already own it. Prevents other processes
to think that you crashed and taking over the lock

* `clear`
- finished with lock, and gracefully clear the lock. If a process needs
to be force cleared, add `true` to the argument.

* `state`
- check if you own the lock
