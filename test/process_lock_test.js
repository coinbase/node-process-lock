const assert = require('assert');
const Process = require('./support/process');

const firstProcess = new Process('same-name', 1);
const secondProcess = new Process('same-name', 1);

describe('ProcessLock', function() {
    it('firstProcess should be able to obtain lock', function(done) {
        firstProcess.processLock.lock((err, result) => {
            assert.ifError(err);
            assert(firstProcess.processLock.owner);
            assert.equal(result, true);
            done();
        });
    });

    it('secondProcess should not be able to obtain the lock', function(done) {
        secondProcess.processLock.lock((err, result) => {
            assert.ifError(err);
            assert.equal(result, false);
            assert.equal(false, secondProcess.processLock.owner);
            done();
        });
    });

    it('firstProcess should be able to let go of the lock', function(done) {
        firstProcess.processLock.clear((err, result) => {
            assert.ifError(err);
            assert.equal(result, true);
            assert.equal(false, firstProcess.processLock.owner);
            done();
        });
    });

    it('secondProcess should be able to obtain the lock', function(done) {
        secondProcess.processLock.lock((err, result) => {
            assert.ifError(err);
            assert.equal(secondProcess.processLock.timeout, 1);
            assert.equal(result, true);
            assert.equal(true, secondProcess.processLock.owner);
            done();
        });
    });

    it('secondProcess should be able to update the lock', function(done) {
        setTimeout(() => {
            secondProcess.processLock.update((err, result) => {
                assert.ifError(err);
                assert.equal(result, true);
                assert(secondProcess.processLock.owner);
                done();
            });
        }, 500)
    });

    it('firstProcess should not be able to update the lock', function(done) {
        setTimeout(() => {
            firstProcess.processLock.update((err, result) => {
                assert.ifError(err);
                assert.equal(result, false);
                assert.equal(false, firstProcess.processLock.owner);
                done();
            });
        }, 500);
    });

    it('firstProcess should not be able to lock because secondProcess recently updated', function(done) {
        setTimeout(() => {
            firstProcess.processLock.lock((err, result) => {
                assert.ifError(err);
                assert.equal(result, false);
                assert.equal(false, firstProcess.processLock.owner);
                done();
            });
        }, 250);
    });

    it('firstProcess should be able to lock due to timeout', function(done) {
        setTimeout(() => {
            firstProcess.processLock.lock((err, result) => {
                assert.ifError(err);
                assert.equal(result, true);
                assert(firstProcess.processLock.owner);
                done();
            });
        }, 1500)
    });

    it('secondProcess should be able to force the lock to clear', function(done) {
        secondProcess.processLock.clear(true, (err, result) => {
            assert.ifError(err);
            assert.equal(result, true);
            secondProcess.processLock.state((err, state) => {
                assert.ifError(err);
                assert.equal('open', state);
                done();
            })
        });
    });

    it('second lock clear returns null', (done) => {
        secondProcess.processLock.clear(true, (err, result) => {
            assert.ifError(err);
            assert.equal(result, null);
            done();
        });
    });
});
