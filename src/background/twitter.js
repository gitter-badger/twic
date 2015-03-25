import TwitterAPI from './twitter/api';
import getTwitterAuthorizer from './twitter/auth';

import User from './model/user';
import Friendship from './model/friendship';
import Tweet from './model/tweet';

import Url from './model/entities/url';

import Response from './response';

import qs from 'querystring';

export default class Twitter {
	constructor(db) {
		this.api = new TwitterAPI();
		this.db = db;
	}

	authorize(flowStartCallback = null, screenName = null) {
		var twitter = this;

		return getTwitterAuthorizer(screenName)
			.then(function(auth) {
				if (flowStartCallback) {
					flowStartCallback();
				}

				return new Promise(function(resolve) {
					chrome.identity.launchWebAuthFlow({
						url: auth.getAuthenticateUrl(),
						interactive: true
					}, function(redirectURI) {
						if (chrome.runtime.lastError) {
							throw new Error(chrome.runtime.lastError.message);
						}

						var linkElement = document.createElement('a');
						var params;

						linkElement.href = redirectURI;

						if (!linkElement.search) {
							throw new Error('wrong redirect url');
						}

						params = qs.decode(linkElement.search.substr(1));

						if (undefined !== params.denied) {
							throw new Error('access denied');
						}

						if (!params
							|| undefined === params.oauth_token
							|| undefined === params.oauth_verifier
						) {
							throw new Error('unknown auth reply');
						}

						if (!auth.isTokenValid(params.oauth_token)) {
							throw new Error('auth reply token invalid');
						}

						auth.getAccessToken(params.oauth_verifier)
							.then(resolve);
					});
				});
			})
			.then(function([token, userId]) {
				return twitter
					.getUser(userId)
					.then(function(user) {
						return [token, user];
					});
			});
	}

	updateUrl(urlJSON) {
		var twitter = this;

		return Url
			.getById(this.db, urlJSON['url'])
			.then(function(url) {
				if (!url) {
					url = new Url();
				}

				url.parse(urlJSON);

				return url
					.save(twitter.db)
					.then(function() {
						return url;
					});
			});
	}

	// @depreacted?
	updateUserEntities(userEntitiesJSON) {
		var twitter = this;

		if (undefined === userEntitiesJSON) {
			return Promise.resolve();
		}

		return Promise.all(
			Object.keys(userEntitiesJSON).map(key => {
				var data = userEntitiesJSON[key];

				if (!Array.isArray(data['urls'])) {
					return Promise.resolve();
				}

				return Promise.all(data['urls'].map(url => twitter.updateUrl(url)));
			})
		);
	}

	updateTweetEntities(tweetEntitiesJSON) {
		var twitter = this;

		if (undefined === tweetEntitiesJSON
			|| undefined === tweetEntitiesJSON['urls']
		) {
			return Promise.resolve();
		}

		return Promise.all(tweetEntitiesJSON['urls'].map(url => twitter.updateUrl(url)));
	}

	updateUser(userJSON) {
		var twitter = this;

		return User
			.getById(this.db, userJSON['id_str'])
			.then(function(user) {
				if (!user) {
					user = new User();
				}

				user.parse(userJSON);

				return user
					.save(twitter.db)
					.then(function() {
						return user;
					});
			});
	}

	updateTweet(tweetJSON) {
		var twitter = this;

		return Tweet
			.getById(twitter.db, tweetJSON['id_str'])
			.then(function(tweet) {
				if (!tweet) {
					tweet = new Tweet();
				}

				return twitter
					.updateTweetEntities(tweetJSON.entities)
					.then(function() {
						tweet.parse(tweetJSON);

						return tweet
							.save(twitter.db)
							.then(function() {
								return Promise.all([
									twitter.updateUser(tweetJSON['user']),
									function() {
										if (tweetJSON['retweeted_status']) {
											return twitter.updateTweet(tweetJSON['retweeted_status']);
										}

										return Promise.resolve();
									}
								]).then(function() {
									return tweet;
								});
							});
					});
			});
	}

	getUserByScreenName(screenName) {
		var twitter = this;

		return User
			.getByScreenName(this.db, screenName)
			.then(function(user) {
				if (user
					&& !user.isOutdated()
				) {
					return user;
				}

				if (!user) {
					user = new User();
				}

				return twitter.api.getUserInfoByScreenName(screenName)
					.then(twitter.updateUser.bind(twitter))
					.catch(function(response) {
						if (!(response instanceof Response)) {
							throw response;
						}

						if (404 === response.status) {
							return null;
						}
						// error codes @ https://dev.twitter.com/overview/api/response-codes
						// if (403 === response.status) {
							// .code == 63 -> user has beed suspended
						// }
					});
			});
	}

	getUserById(userId) {
		var twitter = this;

		return User
			.getById(this.db, userId)
			.then(function(user) {
				if (user
					&& !user.isOutdated()
				) {
					return user;
				}

				if (!user) {
					user = new User();
				}

				return twitter.api.getUserInfoById(userId)
					.then(twitter.updateUser.bind(twitter))
					.catch(function(response) {
						if (!(response instanceof Response)) {
							throw response;
						}

						if (404 === response.status) {
							return null;
						}
						// error codes @ https://dev.twitter.com/overview/api/response-codes
						// if (403 === response.status) {
							// .code == 63 -> user has beed suspended
						// }
					});
			});
	}

	getHomeTimeline(token, sinceId) {
		var twitter = this;

		return this.api.getHomeTimeline(token, sinceId)
			.then(function(tweets) {
				if (!Array.isArray(tweets)) {
					return [];
				}

				return Promise.all(
					tweets.map(tweetJSON => twitter.updateTweet(tweetJSON))
				);
			});
	}

	updateFriendShip(userId, targetUserId, isFollower) {
		var twitter = this;

		return Friendship
			.getByUserIds(this.db, userId, targetUserId)
			.then(function(friendship) {
				if (!friendship) {
					let friendship = new Friendship();
					friendship.ids = [userId, targetUserId].join('_');
					friendship.exists = true;
					friendship.markAsChanged();
					return friendship.save(twitter.db);
				} else {
					if (!friendship.exists) {
						friendship.exists = true;
						friendship.markAsChanged();
						return friendship.save(twitter.db);
					}
				}

				return Promise.resolve();
			});
	}

	getConfiguration() {
		return this.api.getConfiguration();
	}
}
