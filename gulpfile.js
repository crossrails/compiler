var gulp = require('gulp');
var concat = require('gulp-concat');
var git = require('gulp-git');
var del = require('del');
var run = require('gulp-run');

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
  //return run('cd wiki && javac Wiki.java && java Wiki && git clone https://github.com/crossrails/compiler.wiki.git && mv wiki.md compiler.wiki/compiler-options.md && cd compiler.wiki/ && git add compiler-options.md && git commit -m "Updated compiler options" && git push && cd .. && rm -R compiler.wiki/ ').exec();
  //return run('cd wiki && mvn clean package && java -cp target/Wiki-1.0-SNAPSHOT.jar io.xrails.App && git clone https://github.com/crossrails/compiler.wiki.git && mv wiki.md compiler.wiki/compiler-options.md && cd compiler.wiki/ && git add compiler-options.md && git commit -m "Updated compiler options" && git push && cd .. && rm -R compiler.wiki/ ').exec();
  return run('cd wiki && mvn clean package && java -cp target/Wiki-1.0-SNAPSHOT.jar io.xrails.App && rm -rf compiler.wiki/ && git clone https://github.com/crossrails/compiler.wiki.git && mv wiki.md compiler.wiki/compiler-options.md && cd compiler.wiki/ && git add compiler-options.md && git commit -m "Updated compiler options" && git push && cd .. && rm -R compiler.wiki/ ').exec();
  // return run('cd wiki && mvn clean package && java -cp target/Wiki-1.0-SNAPSHOT.jar io.xrails.App ').exec();
});

gulp.task('run-java-tests', function() {
  return run('cd tests/java/ && gradle test').exec();
});
  