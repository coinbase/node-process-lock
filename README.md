# process-lock-node

[![npm version](https://badge.fury.io/js/process-lock-node.svg)](https://www.npmjs.com/package/process-lock-node)

> Simple process locking using Redis.

This module lets you spin up two networked processes and ensure only one of them runs at a time. Lock state is synchronized between processes using Redis.

## Installation

```javascript
npm install process-lock-node
```

## Usage

Ensure that the `REDIS_URL` environment variable is set for each process using this library: 

```
REDIS_URL=redis://your-redis-host:6379
```

In your process, intialize a lock by giving it a name and timeout: 

```javascript
const ProcessLock = require('process-lock-node');

const processLock = new ProcessLock('lock_name', 60);
```

#### Acquire a lock

When the process starts up, attempt to acquire the lock: 

```javascript
function waitForLock() {
    processLock.lock((err, owner) => {
        if (owner) {
            startProcess();
        } else {
            setTimeout(waitForLock, 60000);
        }
    });
}
```

#### Refresh the lock

As long as the process is running, ensure that you refresh the lock. If you do not refresh the lock, 
it will expire automatically in `timeout` seconds, where `timeout` is the value you passed when initializing 
the lock. This is to prevent a process that unexpectly dies from holding the lock indefinitely.

```javascript
function startProcess() {
    setInterval(() => {
        processLock.update((err, renewed) => {
            if (err || !renewed) {
                // Handle the error
            }
        });
    }, 30000);
}
```

The refresh interval must be smaller than the `timeout` to ensure that we refresh before the lock expires. Setting the refresh interval to half of the timeout is recommended.

### Release the lock

When the process exits, clean up the lock so that it can be acquired by another process: 

```javascript
onProcessExit(() => {
    processLock.clear((err, cleared) => {
        if (err || !cleared) {
            // Log the error
        }
    });
});
```
### API reference

#### `new ProcessLock(lockName, timeout)`

Construct a process lock.

* `lockName: string` A name for the lock. Processes that require synchronization should initialize a lock with the same `lockName`.
* `timeout: number` Seconds from now when an acquired lock will expire and be automatically released.

#### `processLock.lock([callback])`

Attempt to acquire a lock.

* `callback: (err, value: boolean) -> ()` A [node-style](https://nodejs.org/api/errors.html#errors_node_js_style_callbacks) callback that receives the result of attempting to acquire the lock. `value` is true if the lock was obtained.

#### `processLock.update([callback])`

Attempt to renew a lock.

* `callback: (err, value: boolean) -> ()` A callback that receives the result of attempting to renew the lock. `value` is:
	*  `false` if the lock could not be renewed
	*  `true` if it was explicitly renewed.

#### `processLock.clear([force][, callback])`

Attempt to release a lock.

* `force: boolean` If true, force clear the lock even if the current process is not the owner.
* `callback: (err, value: boolean) -> ()` A callback that receives the result of attempting to clear the lock. `value` is: 
	* `false` if the lock was not cleared because the current process was not the owner
	* `true` if the lock was cleared
	* `null` if the lock did not exist at all.

#### `processLock.state([callback])`

Check the state of a lock.

* `callback: (err, value: string) -> ()` A callback that receives the result of checking a lock's state. `value` is `"open"` or `"locked"`.
