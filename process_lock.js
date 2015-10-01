var redis = require('redis');
var redisClient = redis.createClient();

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
  this.id = process.pid;
  this.owner = false;
};

ProcessLock.prototype.lock = function(callback) {
  var self = this;

  redisClient.set(self.key, self.id, 'NX', 'EX', self.timeout, function(err, reply) {

    if (reply) {
      self.owner = true;
    }

    typeof callback === 'function' && callback();
  });
};

ProcessLock.prototype.clear = function(callback, force) {
  var self = this;

  redisClient.get(self.key, function(err, value) {
    if (value != self.id && !force) {
      typeof callback === 'function' && callback();
      return;
    }

    redisClient.del(self.key, function(err, value) {
      self.owner = false;
      typeof callback === 'function' && callback();
    });
  });
};

ProcessLock.prototype.update = function(callback) {
  var self = this;

  if (!self.owner) {
    typeof callback === 'function' && callback();
    return;
  }

  redisClient.expire(self.key, self.timeout);

  typeof callback === 'function' && callback();
}

ProcessLock.prototype.state = function(callback) {
  var self = this;

  redisClient.get(self.key, function(err, value) {
    value === null ? value = 'open' : value = 'locked';
    callback(value);
  });
}

module.exports = ProcessLock;
