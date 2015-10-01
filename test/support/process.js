var ProcessLock = require('../../process_lock');

var Process = function(name) {
  this.name = name;
  this.processLock = new ProcessLock(this.name, 10);
};

module.exports = Process;
