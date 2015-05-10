import ModelJSON from '../modelJSON';
import Parser from '../parser';

import Entities from '../entities';

const parser = new Parser({
	'id_str': [Parser.TYPE_STRING, 'id'],
	'text': [Parser.TYPE_STRING, (original, tweetJSON) => {
		const entities = new Entities();
		const data = { };

		if (tweetJSON.entities) {
			entities
				.parseMentions(tweetJSON.entities.user_mentions)
				.parseUrls(tweetJSON.entities.urls)
				.parseHashtags(tweetJSON.entities.hashtags);
		}

		if (tweetJSON.extended_entities) {
			entities.parseMedia(tweetJSON.extended_entities.media);
		}

		let text = entities.processText(original)
			.replace(/[\r\n]/g, '\n')
			.replace(/\n{2,}/g, '\n\n')  // convert 3+ breaks to 2
			.replace(/\n/g, '<br />');

		if (original !== text) {
			data.originalText = original;
		}

		data.text = text;

		return data;
	}],
	'created_at': [Parser.TYPE_DATE, 'createTime'],
	'user': [Parser.TYPE_UNDEFINED, (original, tweetJSON) => {
		const userInfo = original;

		return {
			userId: original.id_str
		};
	}],
	'in_reply_to_status_id_str': [Parser.TYPE_STRING, (original, tweetJSON) => {
		return {
			replyToId: tweetJSON['in_reply_to_status_id_str']
		};
	}],
	'retweeted_status': [Parser.TYPE_UNDEFINED, (original, tweetJSON) => {
		return {
			retweetedId: original['id_str']
		};
	}]
});

export default class Tweet extends ModelJSON {
	static getCollectionName() {
		return 'tweets';
	}

	static getParser() {
		return parser;
	}

	static getHomeTimeline(db, userId, count = 20) {
		const ids = [];

		return db.getIndex(Tweet.getCollectionName(), 'timeline')
			.then(function(idx) {
				return new Promise(function(resolve, reject) {
					const cursor = idx.openKeyCursor(IDBKeyRange.only(userId), 'prev');

					cursor.onsuccess = function(event) {
						const cursor = event.target.result;
						if (cursor) {
							ids.push(cursor.primaryKey);

							if (ids.length >= count) {
								resolve();
							} else {
								cursor.continue();
							}
						} else {
							resolve();
						}
					};

					cursor.onerror = function(event) {
						reject(event);
					};
				});
			})
			.then(function() {
				return Promise.all(
					ids.map(id => {
						return Tweet.getById(db, id);
					})
				);
			});
	}

	// @todo rethink
	static getLastTimelineId(db, userId) {
		return db.getIndex(Tweet.getCollectionName(), 'timeline')
			.then(function(idx) {
				return new Promise(function(resolve, reject) {
					const cursor = idx.openKeyCursor(IDBKeyRange.only(userId), 'prev');

					cursor.onsuccess = function(event) {
						const cursor = event.target.result;
						resolve(cursor ? cursor.primaryKey : null);
					};

					cursor.onerror = function(event) {
						reject(event);
					};
				});
			});
	}

	addTimelineUserId(userId) {
		if (undefined === this.timelineUserIds) {
			this.timelineUserIds = [];
			this.markAsChanged();
		}

		if (this.timelineUserIds.indexOf(userId) < 0) {
			this.timelineUserIds.push(userId);
			this.markAsChanged();
		}

		return this;
	}
}
