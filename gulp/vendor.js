var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');

var _ = require('lodash');
var gulp = require('gulp');
var gulpSVG = require('gulp-svg-sprite');

var twitterText = require('twitter-text');

gulp.task('vendor:twitter-text', function(callback) {
	var targetPath = path.resolve(__dirname, '../src/vendor/twitter-text.js');

	var content = [
		'/**',
		' * @preserve Many thanks to Twitter for their Twitter Text project',
		' *   https://github.com/twitter/twitter-text-js',
		' */',
		'var regexps = { };'
	];

	_.forEach({
		url: 'extractUrl',
		hash: 'validHashtag',
		mention: 'validMentionOrList'
	}, function(twitterTextRegexpName, regexpName) {
		var regexp = twitterText.regexen[twitterTextRegexpName];

		if (undefined === regexp) {
			throw new Error('Failed to find regexp ' + twitterTextRegexpName);
		}

		content.push(
			'regexps.' + regexpName + ' = ' + regexp + ';'
		);
	} );

	content.push('export default regexps;');

	fs.writeFile(targetPath, content.join('\n'), {}, callback);
});

gulp.task('vendor:contributors', function(callback) {
	var targetPath = path.resolve(__dirname, '../src/vendor/contributors.js');

	childProcess.exec('git shortlog -sne < /dev/tty', function(error, stdout) {
		if (!error) {
			var contributors = [ ];

			stdout
				.replace(/^\s+|\s+$/g, '')
				.split('\n')
				.forEach(function(str) {
					var matches = str.split('\t')[1].match(/(.*?) <(.*?)>/);

					contributors.push({
						name: matches[1],
						email: matches[2]
					});
				} );

			fs.writeFile(
				targetPath,
				'var contributors = ' + JSON.stringify(contributors) + ';\nexport default contributors;',
				{},
				callback
			);
		} else {
			throw error;
		}
	});
});

gulp.task('vendor:evil-icons', function() {
	var paths = _.map([
		'ei-plus.svg',
		'ei-spinner.svg',
		'ei-user.svg'
	], function(path) {
		return 'node_modules/evil-icons/assets/icons/' + path;
	} );

	return gulp.src(paths)
		.pipe(gulpSVG({
			mode: {
				css: {
					prefix: '.%s',
					sprite: 'sprite.svg',
					dest: '',
					bust: false,
					render: {
						styl: true
					}
				}
			}
		}))
		.pipe(gulp.dest('src/vendor/evil-icons'));
});

gulp.task('vendor', [
	'vendor:twitter-text',
	'vendor:evil-icons',
	'vendor:contributors'
]);
