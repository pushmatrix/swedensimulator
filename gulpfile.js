var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');
var insert = require('gulp-insert');
var fs = require('fs')

// Get a list of all the .json model files inside /assets
// We will store this inside the all.js file so that our Sim
// can access it and load the necessary models.
function getModelData() {
  var models = []
  var files = fs.readdirSync('assets');
  files.forEach(function (file) {
      if (file.indexOf('.json') != -1 && file != 'animations.json') {
        models.push(file);
      }
  });
  return 'MODEL_PATH_LIST = ' + JSON.stringify(models) + ";\n";
}

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(concat('all.js'))
    .pipe(insert.prepend(getModelData()))
    .pipe(gulp.dest('./lib/js/'))
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(['src/**/*.coffee', 'css/*.scss', 'assets/*'], ['coffee']);
});

gulp.task('default', ['watch']);
