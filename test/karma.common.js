import path from 'path';

const babelConfig = {
	optional: 'runtime',
	stage: 1,
	loose: 'all'
};

const babelConfigSerialized = JSON.stringify(babelConfig);

export default {
	colors: true,
	frameworks: ['mocha', 'sinon', 'chai-as-promised', 'chai'],
	singleRun: true,
	files: [
		'karma.config.js',
		'src/**/*.js',
		'src/**/*.jsx'
	],
	preprocessors: {
		'src/**/*.js': 'webpack',
		'src/**/*.jsx': 'webpack'
	},
	reporters: ['mocha'],
	webpack: {
		cache: true,
		resolve: {
			extensions: ['', '.js', '.jsx', '.styl'],
			root: [
				path.resolve(__dirname, '../src/chrome'),
				path.resolve(__dirname, '../src/base'),
				path.resolve(__dirname, '../src/_chaos')
			]
		},
		module: {
			preLoaders: [
				{
					test: /\.jsx?$/,
					include: path.resolve('test/karma/'),
					loader: 'babel?' + babelConfigSerialized
				},
				{
					test: /\.jsx?$/,
					include: path.resolve('test/src/'),
					loader: 'babel?' + babelConfigSerialized
				},
				{
					test: /\.jsx?$/,
					include: path.resolve('src'),
					loader: 'isparta',
					query: {
						noAutoWrap: false,
						babel: babelConfig
					}
				},
				{
					test: /\.styl$/,
					loaders: ['css-loader', 'stylus']
				},
				{
					test: /\.svg$/,
					loaders: ['file-loader']
				}
			]
		}
	},
	webpackMiddleware: {
		noInfo: true,
		quiet: true
	}
};
