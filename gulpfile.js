var gulp = require('gulp');
var concat = require('gulp-concat');
var git = require('gulp-git');
var del = require('del');

gulp.task('swiftJSCWrapper', function() {
  del(['temp']).then(paths => {
    git.clone('https://github.com/Reedyuk/SwiftJSCWrapper.git', {args: 'temp'}, function (err) {
      if (err) {
        throw err;
      } else {
        gulp.src('temp/SwiftJSCWrapper/*.swift')
          .pipe(concat('js.swift'))
          .pipe(gulp.dest('tests/swift/src/'));
      }
    });
  });
  
  
});
