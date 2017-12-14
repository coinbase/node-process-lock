var redis = require('redis');
var uuid = require('uuid/v4');
var redisClient = redis.createClient(
  process.env.REDIS_URL
);

/*
  this is a process locker module implemented in Node
  the first process simply sets the key and value, the value
  being the unique process ID

  It also uses the NX and EX flags
  |NX| - only set if key does not exist
  |EX| - set the key to expire after some time (timeout) (seconds)

  The NX flag prevents the second process from locking if
  the key is already set. However, if the first process crashes with out
  being able to clear the lock, the key automatically expires after
  some timeout. Allowing the second process to get the lock

  The running process can keep updating the expire time with the `update`
  function, preventing the blocked process from starting. the `update`
  function should be called periodically to indicate that it's still running.

  When the running process has been stopped, the `clear` function will
  delete the key, allowing the blocked process to obtain the lock
*/

var ProcessLock = function(key, timeout) {
  this.key = key;
  this.timeout = timeout || 10;
  this.id = uuid();
  this.owner = false;
};

/**
 * Request a lock on a process. The callback is a standard node callback that returns true if the lock was obtained.
 */
ProcessLock.prototype.lock = function(callback) {
  var self = this;

  redisClient.set(self.key, self.id, 'NX', 'EX', self.timeout, function(err, reply) {

    if (reply) {
      self.owner = true;
    }

    typeof callback === 'function' && callback(err, self.owner);
  });
};

/**
 * Clear the lock. If force is true, the lock clearing is forced. Otherwise, the lock is only cleared if this objects owns the lock.
 * NB. As of version 2.0.0, the callback argument is last as per node conventions.
 * If the lock was not cleared because we are not the owner, the callback returns false.
 * The callback returns true if the lock was explicitly cleared and if the lock did not exist at all, the callback returns null
 */
ProcessLock.prototype.clear = function(force, callback) {
  var self = this;
  if (typeof force === 'function') {
    callback = force;
    force = false;
  }
  redisClient.get(self.key, function(err, value) {
    if (value !== self.id && !force) {
      // We have lost the lock
      self.owner = false;
      typeof callback === 'function' && callback(err, false);
      return;
    }

    redisClient.del(self.key, function(err, value) {
      self.owner = false;
      typeof callback === 'function' && callback(err, value === 1 ? true : null);
    });
  });
};

/**
 * Try to renew the lock on the process. The callback will return false if a lock could not be renewed; true if it explicitly renewed the lock.
 */
ProcessLock.prototype.update = function(callback) {
  var self = this;

  redisClient.get(self.key, function(err, value) {
    // We have lost the lock
    if (value != self.id) {
      self.owner = false;
    }

    if (!self.owner) {
      typeof callback === 'function' && callback(err, false);
      return;
    }

    redisClient.expire(self.key, self.timeout, (err, val) => {
        typeof callback === 'function' && callback(err, val === 1);
    });
  });
};

ProcessLock.prototype.state = function(callback) {
  var self = this;

  redisClient.get(self.key, function(err, value) {
    value === null ? value = 'open' : value = 'locked';
    callback(err, value);
  });
};

module.exports = ProcessLock;
