/**
 * aqueudct - ES6 generated-based job queue / job runner for the browser
 * @author Felix Lau <felixlaumon@gmail.com>
*/

(function(
  // Reliable reference to the global object (i.e. window in browsers).
  global,

  // Dummy constructor that we use as the .constructor property for
  // functions that return Generator objects.
  GeneratorFunction
) {
  var hasOwn = Object.prototype.hasOwnProperty;

  if (global.wrapGenerator) {
    return;
  }

  function wrapGenerator(innerFn, self, tryList) {
    return new Generator(innerFn, self || null, tryList || []);
  }

  global.wrapGenerator = wrapGenerator;
  if (typeof exports !== "undefined") {
    exports.wrapGenerator = wrapGenerator;
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  wrapGenerator.mark = function(genFun) {
    genFun.constructor = GeneratorFunction;
    return genFun;
  };

  // Ensure isGeneratorFunction works when Function#name not supported.
  if (GeneratorFunction.name !== "GeneratorFunction") {
    GeneratorFunction.name = "GeneratorFunction";
  }

  wrapGenerator.isGeneratorFunction = function(genFun) {
    var ctor = genFun && genFun.constructor;
    return ctor ? GeneratorFunction.name === ctor.name : false;
  };

  function Generator(innerFn, self, tryList) {
    var generator = this;
    var context = new Context(tryList);
    var state = GenStateSuspendedStart;

    function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        throw new Error("Generator has already finished");
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          try {
            var info = delegate.generator[method](arg);

            // Delegate generator ran and handled its own exceptions so
            // regardless of what the method was, we continue as if it is
            // "next" with an undefined arg.
            method = "next";
            arg = void 0;

          } catch (uncaught) {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = uncaught;

            continue;
          }

          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          if (state === GenStateSuspendedStart &&
              typeof arg !== "undefined") {
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
            throw new TypeError(
              "attempt to send " + JSON.stringify(arg) + " to newborn generator"
            );
          }

          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            delete context.sent;
          }

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = void 0;
          }
        }

        state = GenStateExecuting;

        try {
          var value = innerFn.call(self, context);

          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: value,
            done: context.done
          };

          if (value === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = void 0;
            }
          } else {
            return info;
          }

        } catch (thrown) {
          if (method === "next") {
            context.dispatchException(thrown);
          } else {
            arg = thrown;
          }
        }
      }
    }

    generator.next = invoke.bind(generator, "next");
    generator.throw = invoke.bind(generator, "throw");
  }

  Generator.prototype.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(triple) {
    var entry = { tryLoc: triple[0] };

    if (1 in triple) {
      entry.catchLoc = triple[1];
    }

    if (2 in triple) {
      entry.finallyLoc = triple[2];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry, i) {
    var record = entry.completion || {};
    record.type = i === 0 ? "normal" : "return";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryList.forEach(pushTryEntry, this);
    this.reset();
  }

  Context.prototype = {
    constructor: Context,

    reset: function() {
      this.prev = 0;
      this.next = 0;
      this.sent = void 0;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      // Pre-initialize at least 20 temporary variables to enable hidden
      // class optimizations for simple generators.
      for (var tempIndex = 0, tempName;
           hasOwn.call(this, tempName = "t" + tempIndex) || tempIndex < 20;
           ++tempIndex) {
        this[tempName] = null;
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    keys: function(object) {
      var keys = [];
      for (var key in object) {
        keys.push(key);
      }
      keys.reverse();

      // The same { value, done } object can be reused between iterations,
      // because we control the generated code, and we know it doesn't
      // need a new object each time.
      var info = {};

      // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.
      return function next() {
        while (keys.length) {
          var key = keys.pop();
          if (key in object) {
            info.value = key;
            info.done = false;
            return info;
          }
        }

        info.done = true;
        return info;
      };
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    _findFinallyEntry: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") && (
              entry.finallyLoc === finallyLoc ||
              this.prev < entry.finallyLoc)) {
          return entry;
        }
      }
    },

    abrupt: function(type, arg) {
      var entry = this._findFinallyEntry();
      var record = entry ? entry.completion : {};

      record.type = type;
      record.arg = arg;

      if (entry) {
        this.next = entry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      var entry = this._findFinallyEntry(finallyLoc);
      return this.complete(entry.completion);
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry, i);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(generator, resultName, nextLoc) {
      this.delegate = {
        generator: generator,
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
}).apply(this, Function("return [this, function GeneratorFunction(){}]")());

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
  this.jobRunner = aqueduct.run(wrapGenerator.mark(function(resume) {
    var job;

    return wrapGenerator(function($ctx0) {
      while (1) switch ($ctx0.prev = $ctx0.next) {
      case 0:
        $ctx0.next = 2;
        return wait(resume, this.startDelay);
      case 2:
        if (!(this.jobs.length > 0)) {
          $ctx0.next = 9;
          break;
        }

        job = this.jobs[0];
        $ctx0.next = 6;
        return job.start(async ? resume() : null);
      case 6:
        this.jobs.shift();
        $ctx0.next = 2;
        break;
      case 9:
      case "end":
        return $ctx0.stop();
      }
    }, this);
  }).bind(this), this.runnerInterval);
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

aqueduct.Runner = Runner;
aqueduct.Conduit = Conduit;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = aqueduct;
} else if (typeof define === 'function' && define.amd) {
  define(function() {
    return aqueduct;
  });
} else {
  /*jshint -W069 */
  window['aqueduct'] = aqueduct;
}

})();
