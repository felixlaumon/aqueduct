'use strict';

var gulp = require('gulp');
var regenerator = require('gulp-regenerator');
var rename = require('gulp-rename');

// TODO generate alt version without the runtime
gulp.task('default', function () {
  gulp.src('src/aqueduct.js')
    .pipe(regenerator({
      includeRuntime: true
    }))
    .pipe(rename('index.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('example', function () {
  gulp.src('example/infinite-scroll.js')
    .pipe(regenerator())
    .pipe(rename('infinite-scroll-transpiled.js'))
    .pipe(gulp.dest('example'));
});
