import EventEmitter from './eventEmitter';

var STORAGE_FIELD = Symbol('storage');
var CACHE_FIELD = Symbol('cache');

var CHANGE_EVENT = 'change';

export default class Config extends EventEmitter {
	constructor(storage) {
		super();

		const config = this;
		const cache = this[CACHE_FIELD] = { };

		this[STORAGE_FIELD] = storage.sync;

		storage.onChanged.addListener(function(changes, namespace) {
			if ('sync' !== namespace) {
				return;
			}

			for (let key in changes) {
				cache[key] = changes[key].newValue;
				config.emit([CHANGE_EVENT, key].join('.'), cache[key]);
			}

			config.emit(CHANGE_EVENT);
		});
	}

	get(key) {
		const config = this;

		if (undefined !== config[CACHE_FIELD][key]) {
			return Promise.resolve(config[CACHE_FIELD][key]);
		}

		return new Promise(function(resolve, reject) {
			config[STORAGE_FIELD].get(key, function(items) {
				resolve(items[key]);
			});
		});
	}

	set(key, value) {
		const config = this;
		const storeObj = { };

		storeObj[key] = value;

		return new Promise(function(resolve, reject) {
			config[STORAGE_FIELD].set(storeObj, function() {
				if (chrome.runtime.lastError) {
					reject(
						new Error(
							undefined !== chrome.runtime.lastError.message ?
								chrome.runtime.lastError.message : 'Failed to save data'
						)
					);
				} else {
					config[CACHE_FIELD][key] = value;

					resolve();
				}
			});
		});
	}
}
