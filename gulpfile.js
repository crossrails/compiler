var gulp = require('gulp');
var concat = require('gulp-concat');
var git = require('gulp-git');
var del = require('del');

gulp.task('javascriptcore.swift', function() {
  git.clone('https://github.com/crossrails/javascriptcore.swift.git', {args: 'temp'}, function (err) {
    if (err) {
      throw err;
    } else {
      gulp.src('temp/Source/*.swift')
        .pipe(concat('javascriptcore.swift'))
        .pipe(gulp.dest('src/swift/src/'));
    }
  }).then(del(['temp']));
});
