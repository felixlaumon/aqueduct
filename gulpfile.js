'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var regenerator = require('gulp-regenerator');
var traceur = require('gulp-traceur');
var traceur_runtime = 'node_modules/gulp-traceur/node_modules/traceur/bin/traceur-runtime.js';

gulp.task('regenerator', function () {
  gulp.src('src/aqueduct.js')
    .pipe(regenerator())
    .pipe(gulp.dest('./'));
});
