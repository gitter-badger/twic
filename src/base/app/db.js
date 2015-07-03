import DB from 'core/db';

const db = new DB('twic');

db.registerMigration(1, instance => {
	let objectStore = instance.createObjectStore('users', { keyPath: 'id' });
	objectStore.createIndex('screenName', 'screenNameNormalized', { unique: true });

	objectStore = instance.createObjectStore('tweets', { keyPath: 'id' });
	objectStore.createIndex('timeline', 'timelineUserIds', { unique: false, multiEntry: true });
	objectStore.createIndex('mention', 'mentionUserId', { unique: false, multiEntry: true });
	objectStore.createIndex('retweeted', 'retweetedId', { unique: false, multiEntry: true });

	objectStore = instance.createObjectStore('friendship', { keyPath: 'ids' });
	objectStore.createIndex('userId', 'userId', { unique: false });
});

export default db;
