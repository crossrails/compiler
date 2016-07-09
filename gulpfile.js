var gulp = require('gulp');
var concat = require('gulp-concat');
var git = require('gulp-git');
var del = require('del');
var shell = require('gulp-shell');

gulp.task('build-wrappers', function() {
  del(['temp']).then(paths => {
    git.clone('https://github.com/crossrails/javascriptcore.swift.git', {args: 'temp'}, (err) => {
      if (err) {
        throw err;
      } else {
          gulp.src('temp/Source/*.swift')
          .pipe(concat('javascriptcore.swift'))
          .pipe(gulp.dest('src/swift/'))
          .on('end', function() {
            del(['temp']);
          })
      } 
    })
  });
});

gulp.task('gen-markdown', function() {
  gulp.src('.')
    .pipe(shell([
        'node src/main --help > spec.md'
    ]));
});
