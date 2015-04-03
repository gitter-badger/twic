# Twic <a href="https://github.com/silentroach/twic"><img align="right" src="https://cdn.rawgit.com/silentroach/twic/master/src/images/toolbar.svg" width="48px" /></a>

[![Travis](https://img.shields.io/travis/silentroach/twic.svg?style=flat-square)](https://travis-ci.org/silentroach/twic)
[![Code Climate](https://img.shields.io/codeclimate/github/silentroach/twic.svg?style=flat-square)](https://codeclimate.com/github/silentroach/twic)
[![David](https://img.shields.io/david/silentroach/twic.svg?style=flat-square)](https://david-dm.org/silentroach/twic)

Twitter client for Chromium based browsers written with [ES6](https://babeljs.io/) and [React](http://facebook.github.io/react/).

## Inside

Project is written in ES6 + Stylus and transpiled to the code that is supported by current stable Chromium browsers.

It uses client-server architecture with Chrome messaging system to communicate. IndexedDB is used to store user data and Chrome Sync Storage is used to sync accounts list and user settings. Twitter authentication is partially based on Chrome Identity webflow. React is used as render engine for popup and options pages.

## Contribute

Feel free to help me build awesome Twitter client.

### Localization 

All translation files are in *src/i18n* folder in simple JSON format.

### Develop

All you need to start develop is to install io.js and run:

	# npm install
	# npm run dev

It will install all dependencies, build development sources and start to watch changes. Then you can add generated *build* folder to your Chrome browser.

Please respect the [EditorConfig](http://editorconfig.org/) project settings and eslint rules.

### Test

To check your contribution code you need just to run

	# npm run test
