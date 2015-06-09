const gulp = require('gulp');
const gulpEslint = require('gulp-eslint');

module.exports = function(gulp, config) {

	gulp.task('lint', function() {
		return gulp.src([
			'src/**/*.*(js|jsx)',
			'gulp/*.js',
			'test/**/*.js',
			'!src/base/vendor/*'
		])
		.pipe(gulpEslint())
		.pipe(gulpEslint.format())
		.pipe(gulpEslint.failAfterError());
	});

};
