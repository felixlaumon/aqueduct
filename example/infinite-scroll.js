/*global _:false*/
(function () {

'use strict';

function noop () {
}

function loop (n, iterator, context) {
  for (var i = 0; i < n; i++) {
    iterator.call(context, i);
  }
}

function freeze (ms) {
  var start = Date.now();
  while (Date.now() - start < ms) { true; }
}

function wait (ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

var mode = '';
if (location.search.indexOf('aqueduct') >= 0) {
  console.log('aqueduct enabled');
  mode = 'aqueduct';
  $('#aqueduct-mode').text('enabled');
  $('#toggle-aqueduct').text('Disable Aqueduct').attr('href', './infinite-scroll.html');
} else {
  console.log('aqueduct disabled');
  $('#aqueduct-mode').text('disabled');
  $('#toggle-aqueduct').text('Enable Aqueduct').attr('href', './infinite-scroll.html?aqueduct');
}

var n = 20;
var itemTemplate = $('#item-template').html();
var aqueduct = window.aqueduct;
var $container = $('#container');
var conduit = aqueduct.create({
  interval: 2,
  runnerInterval: 0,
  startDelay: 0
});

function Item () {
  this.$el = $(itemTemplate);
}

var count = 0;
Item.prototype.preload = function (cb) {
  console.log('preloading');
  this.$img = this.$el.find('.thumbnail');
  this.src = this.$img.attr('src') + '?' + count++;
  this.$img.attr('src', '');
  var img = new Image();
  img.src = this.src;
  img.onload = cb;
};

Item.prototype.fadeInG = function* () {
  console.log('fading in');
  this.$img.css('background-image', 'url(' + this.src + ')');
  yield wait(1);
  this.$img.css('opacity', 1);
};

Item.prototype.fadeIn = function () {
  console.log('fading in');
  this.$img.css('background-image', 'url(' + this.src + ')');
  setTimeout(function () {
    this.$img.css('opacity', 1);
  }.bind(this));
};

Item.prototype.load = function (cb) {
  setTimeout(function () {
    freeze(25);
    cb();
  }, 1);
};

Item.prototype.loadG = function* (resume) {
  yield wait(1);
  yield freeze(25);
};

Item.prototype.render = function () {
  return this.$el;
};

var buffer = 25;
var atBottom = false;
function scrollBottomDetector (e) {
  var maxScrollY = window.document.body.scrollHeight - window.innerHeight;
  if (window.scrollY > (maxScrollY - buffer)) {
    if (!atBottom) {
      atBottom = true;
      console.log('scrolled to bottom');

      if (mode === 'aqueduct') {
        conduit.push(appendItemG);
      } else {
        appendItem();
      }
    }
  } else {
    atBottom = false;
  }
}

var isScolling = false;
function scrollDetector () {
  if (!isScolling) {
    isScolling = true;
    console.log('scroll start');
    conduit.stop();
  }
  scrollEnd();
}

var scrollEnd = _.debounce(function () {
  isScolling = false;
  console.log('scroll end');
  conduit.start();
}, 300);

$(window).scroll(_.throttle(scrollBottomDetector, 50));
$(window).scroll(_.throttle(scrollDetector, 50));

function* appendItemG (resume) {
  for (var i=0; i < n; i++) {
    var item = new Item();
    $container.append(item.render());
    yield item.loadG();
    yield item.preload.call(item);
    yield item.fadeInG.call(item);
  }
}

function appendItem () {
  loop(n, function () {
    var item = new Item();
    $container.append(item.render());
    item.load(function () {
      item.preload(function () {
        item.fadeIn();
      });
    });
  });
}

appendItem();

setTimeout(function () {
  window.scrollTo(0, 0);
}, 1);

})();
