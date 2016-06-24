var gulp = require('gulp');
var concat = require('gulp-concat');
var git = require('gulp-git');
var del = require('del');

gulp.task('build-wrappers', function() {
  del(['temp']).then(paths => {
    git.clone('https://github.com/crossrails/javascriptcore.swift.git', {args: 'temp'}, (err) => {
      if (err) {
        throw err;
      } 
      gulp.src('temp/Source/*.swift')
        .pipe(concat('javascriptcore.swift'))
        .pipe(gulp.dest('src/swift/'));
    })
  });
});
