var ProcessLock = require('../../process_lock');

var Process = function(name, timeout) {
  this.name = name;
  this.processLock = new ProcessLock(this.name, timeout);
};

module.exports = Process;
