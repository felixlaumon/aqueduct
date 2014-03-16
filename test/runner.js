describe('aqueduct.Runner', function() {
  var aqueudct = window.aqueduct;
  var Runner = window.aqueduct.Runner;

  it('should be defined', function () {
    expect(Runner).to.be.defined;
  });

  describe('#constructor', function () {
    it('should initialize the Runner', function () {
      var runner = new Runner(function* () {}, 0);
      expect(runner.stopped).to.be.false;
      expect(runner.waiting).to.be.false;
      expect(runner.done).to.be.false;
      expect(runner.interval).to.equal(0);
      expect(runner.interval).to.equal(0);
      // expect(runner.generator).to.equal();
      // expect(runner.iterator).to.equal();
    });
  });

  describe('#start', function () {
    // TODO use fake timer instead
    it('should allow normal function to be yielded', function (done) {
      var spy = sinon.spy();
      var runner = new Runner(function* () {
        yield spy();
        yield spy();
      }, 50);
      runner.start(function () {
        expect(spy.callCount).to.equal(2);
        done();
      });
    });

    it('should allow generator function to be yielded', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var fn1 = function* (resume) {
        yield spy();
        yield spy();
      };
      var runner = new Runner(function* () {
        yield fn1();
      }, 2);
      runner.start();
      clock.tick(100);
      clock.restore();
      expect(spy).to.be.calledTwice;
    });

    it('should allow generator to be yielded', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var fn1 = function* (resume) {
        yield spy();
        yield spy();
      };
      var runner = new Runner(function* () {
        yield fn1;
      }, 2);
      runner.start();
      clock.tick(100);
      clock.restore();
      expect(spy).to.be.calledTwice;
    });

    // TODO
    it.skip('should allow array to be yielded');
    // TODO
    it.skip('should allow object to be yielded');

    // TODO
    it.skip('should accept normal function', function (done) {
      var runner = new Runner(function () {
      }, 50)
      .start(function () {
        done();
      });
    });

    it('should not throw error if there is one yield', function () {
      var clock = sinon.useFakeTimers();
      var runner = new Runner(function* () {
        yield 5;
      }, 2);
      runner.start();
      clock.tick(100);
      clock.restore();
    });

    it('should ignore if there is no "yield" in the generator function', function () {
      var runner = new Runner(function* () {});
      runner.start();
      expect(runner.done).to.be.true;
    });

    it('should run the generator function continuously if no interval is given', function () {
      var spy = sinon.spy();
      var runner = new Runner(function* () {
        yield spy();
        yield spy();
        yield spy();
      });
      runner.start();

      expect(spy).to.be.calledThrice;
    });

    it('should run generator recursively', function (done) {
      var spy = sinon.spy();

      var fn1 = function* () {
        // yield fn2();
        // yield fn2();
        yield fn2;
        yield fn2;
      };
      var fn2 = function* () {
        yield spy();
        yield spy();
      };

      var runner = new Runner(function* () {
        yield fn1;
        yield fn1;
      }, 50);
      runner.start(function () {
        expect(spy.callCount).to.equal(8);
        done();
      });
    });

    it('should wait when resume() is invoked', function () {
      var clock = sinon.useFakeTimers();
      var startSpy = sinon.spy();
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      var waitSpy = sinon.spy();
      var wait = function (cb) {
        // console.log('waiting');
        setTimeout(function () {
          // console.log('waiting done');
          waitSpy();
          cb();
        }, 100);
      };
      var fn1 = function* (resume) {
        // console.log('start');
        yield wait(resume());
        spy1();
        yield wait(resume());
        spy2();
        // console.log('done');
      };

      var runner = new Runner(function* () {
        yield fn1;
      }, 100);
      runner.start();

      clock.tick(100);
      expect(waitSpy).to.be.calledOnce;
      clock.tick(100);
      expect(spy1).to.be.calledOnce;
      expect(spy2).to.not.be.called;
      expect(waitSpy).to.be.calledOnce;
      clock.tick(100);
      expect(waitSpy).to.be.calledTwice;
      clock.tick(100);
      expect(spy2).to.be.calledOnce;

      clock.restore();
    });

    it('should wait when a thunk is returned', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var wait = function (ms) {
        return function (cb) {
          setTimeout(cb, ms);
        };
      };

      var runner = new Runner(function* () {
        yield wait(10);
        spy();
        yield wait(10);
        spy();
      });
      runner.start();

      clock.tick(10);
      expect(spy).to.be.calledOnce;
      clock.tick(10);
      expect(spy).to.be.calledTwice;

      clock.restore();
    });

    it('should have more test...');
  });

  describe('#stop', function () {
    it('should stop the runner', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var runner = new Runner(function* () {
        yield spy();
        yield spy();
      }, 50);

      runner.start();
      runner.stop();
      clock.tick(500);
      clock.restore();

      expect(spy.callCount).to.equal(1);
    });

    it('should stop the inner runner', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var fn1 = function* () {
        yield spy();
        yield spy();
      };

      var runner = new Runner(function* () {
        // yield fn1();
        // yield fn1();
        yield fn1;
        yield fn1;
      }, 50);
      runner.start();
      runner.stop();
      clock.tick(500);
      clock.restore();
      expect(spy.callCount).to.equal(1);
    });
  });
});
