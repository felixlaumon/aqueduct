# aqueduct

> ES6 generated-based job queue / job runner for the browser

**Experimental**

## Usage

Say you've got a slow function (>250ms, e.g. heavy DOM manipulation etc), but you don't want to freeze up the browser to retain responsiveness. One way to achieve this is to break the function up into smaller chunks, and run them bit by bit by `setTimeout`.

````js
function slowOperation () {
  // Some work here. ..
  setTimeout(function part1 () {
    // Some more work here ...
    setTimeout(function part2 () {
      // Some more work here ...
      setTimeout(function part3 () {
        // Even some more work here ...
      }, 100)
    }, 100)
  }, 100)
}
````

With `aqueduct`, you can write the following without splitting up your function and wrapping them in `function () {}`.

````js
var conduit = aqueduct.create({
  interval: 100,
});
conduit.push(function* slowOperation () {
  yield part1();
  yield part2();
  yield part3();
});
conduit.start();
````

In this example, `part2` will be executed after 100ms after `part1` is completed.

An advantage of using `aqueduct` over `setTimeout`-based solution is that, you can **pause** the slow function by `conduit.stop()` and resume later `conduit.start()`, if you want to prioritize other processing.

## Use cases

One real world use case scenario is to loading heavy content in an infinite scrolling web page. To prevent janky scrolling, use `conduit.push()` to append the items to the DOM, and call `conduit.pause()` to when the user starts scrolling. But of course, you should try to optimize with the techniques in http://jankfree.org/ first. (See `example/infinite-scroll.html`)

Another example is to improve responsiveness of slider-based web page. When the user starts touching the slider, pause all other slow functions by `conduit.pause` to make sure touch events can be emitted 60 FPS. (See `example/slider.html`)

## API

...

## Limitation

Since `aqueduct` relies on generator, you will have to transpile your ES6 code by something like [Traceur](https://github.com/google/traceur-compiler) and [regenerator](https://github.com/facebook/regenerator).

`aqueduct` is transpiled as `index.js` with [regenerator](https://github.com/facebook/regenerator) with the [runtime](https://github.com/facebook/regenerator/blob/master/runtime/dev.js). You might to use the source file in `src/aqueduct.js` and pass everthing through the transpiler instead.

## Todo

- Test with delegate yield
- Test compatibility with thunk-style callback
- Change start() to return thunk-style callback

## Test

- Use Karma
- Require the harmony branch of Istanbul for code coverage
- Travis integration

## Reference and related projects

- http://kangax.github.io/es5-compat-table/es6/#Generators_(yield)
- http://airbnb.github.io/infinity/
- https://github.com/visionmedia/co
- https://gist.github.com/creationix/5762837

## License

MIT
