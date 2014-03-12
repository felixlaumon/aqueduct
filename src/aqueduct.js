(function () {

'use strict';

var aqueduct = {};

aqueduct.run = function (generator, interval) {
  // TODO normalize normal function to generator
  return new Runner(generator, interval);
};

aqueduct.create = function (options) {
  return new Conduit(options);
};

function Conduit (options) {
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
    this.jobRunner.stop();
    delete this.jobRunner;
  }

  var async = this.runnerInterval > 0;
  this.jobRunner = aqueduct.run(function* (resume) {
    yield wait(resume, this.startDelay);

    while (this.jobs.length > 0) {
      var job = this.jobs[0];
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
  this.generator = generator;
  this.stopped = false;
  this.waiting = false;
  this.interval = interval || 0;
  this.done = false;

  this.async = this.generator.length === 1;
  this.iterator = this.generator(this._resume.bind(this));
}

Runner.prototype.start = function (doneCb) {
  if (this.done) {
    return;
  }

  this.stopped = false;
  this.doneCb = doneCb;
  this._next();
};

Runner.prototype.stop = function () {
  this.stopped = true;
};

Runner.prototype._resume = function () {
  this.waiting = true;
  return function () {
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
  // console.log(output);

  if (output.done) {
    this.done = true;
    this.doneCb && this.doneCb();
    return;
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

function wait (resume, timeout) {
  if (!timeout) {
    return;
  }

  setTimeout(resume(), timeout);
}

window.aqueduct = aqueduct;

})();
