describe('conduit', function () {
  var aqueduct = window.aqueduct;
  var Conduit = aqueduct.Conduit;

  it('should be defined', function () {
    expect(Conduit).to.be.defined;
  });

  describe('#constructor', function () {
    it('should...');
  });

  describe('#start', function () {
    it('should start running the jobs', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var conduit = new Conduit({ interval: 2 });
      conduit.push(function* () {
        yield spy();
        yield spy();
      });
      conduit.push(function* () {
        yield spy();
        yield spy();
      });
      conduit.start();
      clock.tick(10);
      clock.restore();
      expect(spy.callCount).to.equal(4);
    });

    it('should restart jobs after stopped', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var conduit = new Conduit({ interval: 10 });
      var fn1 = function* () {
        yield wait(10);
        spy();
        yield wait(10);
        spy();
        yield wait(10);
        spy();
        yield wait(10);
        spy();
      };
      conduit.push(function* () {
        yield fn1();
        yield fn1();
      });

      conduit.start();
      clock.tick(30);
      expect(spy.callCount).to.equal(1);

      conduit.stop();
      clock.tick(1000);
      expect(spy.callCount).to.equal(1);

      conduit.start();
      clock.tick(1000);
      expect(spy.callCount).to.equal(8);
      clock.restore();
    });
  });

  describe('#stop', function () {
    it('should stop running the jobs', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var conduit = new Conduit({ interval: 2 });
      conduit.push(function* () {
        yield spy();
      });
      conduit.push(function* () {
        yield spy();
      });
      conduit.start();
      clock.tick(2);
      expect(spy.callCount).to.equal(1);
      conduit.stop();
      clock.tick(100);
      expect(spy.callCount).to.equal(1);
      clock.restore();
    });

    it('should stop runner recursively', function () {
      var clock = sinon.useFakeTimers();
      var spy = sinon.spy();
      var fn1 = function* () {
        yield fn2;
      };
      var fn2 = function* () {
        yield spy();
        spy();
      };
      var conduit = new Conduit({ interval: 2 });
      conduit.push(function* () {
        yield fn1;
      });
      conduit.start();
      clock.tick(2);
      clock.restore();
      conduit.stop();
      expect(spy.callCount).to.equal(1);
    });
  });

  describe('#push', function () {
    it('should execute jobs according to specified priority');
  });

  function wait (ms) {
    return function (cb) {
      setTimeout(cb, ms);
    };
  }
});
