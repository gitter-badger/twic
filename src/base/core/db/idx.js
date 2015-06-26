import { promisify } from './request';

const indexField = Symbol('index');

export const Directions = {
	FORWARD: 'next',
	BACKWARD: 'prev'
};

export default class DBIndex {
	constructor(index, store) {
		this[indexField] = index;
	}

	getByValue(value) {
		return promisify(this[indexField].get(value));
	}

	deleteByValue(value, callback) {
		const self = this;
		const request = this[indexField].openKeyCursor(
			IDBKeyRange.only(value)
		);

		return new Promise(function(resolve, reject) {
			request.onerror = function(event) {
				reject(event);
			};

			request.onsuccess = function(event) {
				const cursor = request.result;

				if (!cursor) {
					resolve();
				} else {
					self[indexField].objectStore.delete(cursor.primaryKey);
					cursor.continue();
				}
			};
		});
	}

	getIdsByValue(value, count, direction = Directions.FORWARD) {
		const ids = [];
		const cursor = this[indexField].openKeyCursor(
			IDBKeyRange.only(value), direction
		);

		return new Promise(function(resolve, reject) {
			cursor.onsuccess = function(event) {
				const cursor = event.target.result;
				if (cursor) {
					ids.push(cursor.primaryKey);

					if (ids.length >= count) {
						resolve(ids);
					} else {
						cursor.continue();
					}
				} else {
					resolve(ids);
				}
			};

			cursor.onerror = function(event) {
				reject(event);
			};
		});
	}
}
