var assert = require('assert');
var Process = require('./support/process');

var firstProcess = new Process('same-name');
var secondProcess = new Process('same-name');

describe('ProcessLock', function() {
  it('firstProcess should be able to obtain lock', function(done) {

    firstProcess.processLock.lock(function(){
      assert(firstProcess.processLock.owner);
      done();
    });
  });

  it('secondProcess should not be able to obtain the lock', function(done) {

    secondProcess.processLock.lock(function() {
      assert.equal(false, secondProcess.processLock.owner);
      done();
    });
  });

  it('firstProcess should be able to let go of the lock', function(done) {
    firstProcess.processLock.clear(function() {
      assert.equal(false, firstProcess.processLock.owner);
      done();
    });
  });

  it('secondProcess should be able to obtain the lock', function(done) {
    secondProcess.processLock.lock(function() {
      assert.equal(true, secondProcess.processLock.owner);
      done();
    });
  });

  it('secondProcess should be able to update the lock', function(done) {
    this.timeout(7000);

    setTimeout(function() {
      secondProcess.processLock.update(function() {
        assert(secondProcess.processLock.owner);
        done();
      });
    }, 5000)
  });

  it('firstProcess should not be able to update the lock', function(done) {
    this.timeout(5000);

    setTimeout(function() {
      firstProcess.processLock.update(function() {
        assert.equal(false, firstProcess.processLock.owner);
        done();
      });
    }, 2000);
  });

  it('firstProcess should not be able to lock because secondProcess recently updated', function(done) {
    this.timeout(15000);

    setTimeout(function() {
      firstProcess.processLock.lock(function() {
        assert.equal(false, firstProcess.processLock.owner);
        done();
      });
    }, 7000);
  });

  it('firstProcess should be able to lock due to timeout', function(done) {
    this.timeout(12000)

    setTimeout(function() {
      firstProcess.processLock.lock(function() {
        assert(firstProcess.processLock.owner);
        done();
      });
    }, 10000)
  })

  it('secondProcess should be able to force the lock to clear', function(done) {
    secondProcess.processLock.clear(function(){
      secondProcess.processLock.state(function(state) {
        assert.equal('open', state);
        done();
      })

    }, true)
  })

});