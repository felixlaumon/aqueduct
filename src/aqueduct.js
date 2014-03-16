(function () {

'use strict';

var aqueduct = {};

// TODO test on iPad

aqueduct.run = function (generator, interval) {
  // TODO normalize normal function to generator
  return new Runner(generator, interval);
};

aqueduct.create = function (options) {
  return new Conduit(options);
};

function Conduit (options) {
  options = options || {};
  this.interval = options.interval || 0;
  this.startDelay = options.startDelay || 0;
  this.runnerInterval = options.runnerInterval || this.interval;
  this.jobs = [];
  this.comparator = options.comparator || function (a, b) {
    return a.priority - b.priority;
  };
}

Conduit.prototype.push = function (generator, priority) {
  var job = aqueduct.run(generator, this.runnerInterval);
  job.priority = priority;
  this.jobs.push(job);
};

Conduit.prototype.start = function () {
  this.jobs = this.jobs.filter(function (runner) {
    return !runner.done;
  });
  this.jobs.sort(this.comparator);

  if (this.jobRunner) {
    // Stop and delete previous job runner (because a new one will be created
    // below
    this.jobRunner.stop();
    delete this.jobRunner;
  }

  var async = this.runnerInterval > 0;
  this.jobRunner = aqueduct.run(function* (resume) {
    yield wait(resume, this.startDelay);

    while (this.jobs.length > 0) {
      var job = this.jobs[0];
      // TODO rewrite in thunk style
      yield job.start(async ? resume() : null);
      this.jobs.shift();
    }
  }.bind(this), this.runnerInterval);
  this.jobRunner.start();
};

Conduit.prototype.stop = function () {
  invoke(this.jobs, 'stop');
  this.jobRunner && this.jobRunner.stop();
};

function Runner (generator, interval) {
  this.stopped = false;
  this.waiting = false;
  this.interval = interval || 0;
  this.done = false;

  if (isIterator(generator)) {
    this.iterator = generator;
  } else {
    this.generator = generator;
    this.iterator = this.generator(this.wait.bind(this));
  }
}

Runner.prototype.start = function (doneCb) {
  if (this.done) {
    return;
  }

  // TODO: return thunk instead so that conduit.start doesn't have to use resume
  this.stopped = false;
  this.doneCb = doneCb || this.doneCb;

  if (this.runner) {
    this.runner.start();
  } else {
    this._next();
  }
};

Runner.prototype.stop = function () {
  this.stopped = true;
  this.runner && this.runner.stop();
};

Runner.prototype.wait = function () {
  this.waiting = true;
  return function resume () {
    this.waiting = false;
    this._continue();
  }.bind(this);
};

Runner.prototype._next = function () {
  if (this.stopped) {
    return;
  }

  // TODO how to prevent generator already running error?
  var output = this.iterator.next();

  if (output.done) {
    this.done = true;
    this.doneCb && this.doneCb();
    return;
  }

  var val = output.value;
  if (isGeneratorFunction(val) || isIterator(val)) {
    // Nested generator
    this.runner = new Runner(val, this.interval);
    var resume = this.wait();
    // TODO test if this will overflow stack?
    this.runner.start(function () {
      delete this.runner;
      resume();
    }.bind(this));
    return;
  } else if (typeof val === 'function') {
    // Thunk
    val(this.wait());
  }

  if (!this.waiting) {
    this._continue();
  }
};

Runner.prototype._continue = function () {
  if (this.interval) {
    setTimeout(this._next.bind(this), this.interval);
  } else {
    this._next();
  }
};

function invoke (arr, fn, context) {
  arr.forEach(function (item) {
    item[fn].call(context || item);
  });
}

// TODO write in thunk instead
function wait (resume, timeout) {
  if (!timeout) {
    return;
  }

  setTimeout(resume(), timeout);
}

function isIterator(obj) {
  return obj && 'function' === typeof obj.next && 'function' === typeof obj.throw;
}

function isGeneratorFunction(obj) {
  return obj && obj.constructor && 'GeneratorFunction' === obj.constructor.name;
}

window.aqueduct = aqueduct;
window.aqueduct.Runner = Runner;
window.aqueduct.Conduit = Conduit;

})();
