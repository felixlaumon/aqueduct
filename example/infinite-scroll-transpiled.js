/*global _:false*/
(function () {
  wrapGenerator.mark(appendItemG);
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

  Item.prototype.fadeInG = wrapGenerator.mark(function() {
    return wrapGenerator(function($ctx0) {
      while (1) switch ($ctx0.prev = $ctx0.next) {
      case 0:
        console.log('fading in');
        this.$img.css('background-image', 'url(' + this.src + ')');
        $ctx0.next = 4;
        return wait(1);
      case 4:
        this.$img.css('opacity', 1);
      case 5:
      case "end":
        return $ctx0.stop();
      }
    }, this);
  });

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

  Item.prototype.loadG = wrapGenerator.mark(function(resume) {
    return wrapGenerator(function($ctx1) {
      while (1) switch ($ctx1.prev = $ctx1.next) {
      case 0:
        $ctx1.next = 2;
        return wait(1);
      case 2:
        $ctx1.next = 4;
        return freeze(25);
      case 4:
      case "end":
        return $ctx1.stop();
      }
    }, this);
  });

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

  function appendItemG(resume) {
    var i, item;

    return wrapGenerator(function appendItemG$($ctx2) {
      while (1) switch ($ctx2.prev = $ctx2.next) {
      case 0:
        i = 0;
      case 1:
        if (!(i < n)) {
          $ctx2.next = 13;
          break;
        }

        item = new Item();
        $container.append(item.render());
        $ctx2.next = 6;
        return item.loadG();
      case 6:
        $ctx2.next = 8;
        return item.preload.call(item);
      case 8:
        $ctx2.next = 10;
        return item.fadeInG.call(item);
      case 10:
        i++;
        $ctx2.next = 1;
        break;
      case 13:
      case "end":
        return $ctx2.stop();
      }
    }, this);
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
