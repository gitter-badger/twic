import Watcher from './watcher';
import TwitterStream from './twitter/stream';

const STREAM_CHECK_TIMEOUT = 1000 * 60;

export default class AccountWatcher extends Watcher {
	constructor(twitter, account) {
		super();

		this.twitter = twitter;
		this.account = account;

		this.homeTimelineLastTweetId = null;

		this.stream = null;
		this.streamCheckInterval = null;
	}

	getHomeTimelineLastTweetId() {
		const watcher = this;

		return new Promise(function(resolve) {
			if (null !== watcher.homeTimelineLastTweetId) {
				resolve(watcher.homeTimelineLastTweetId);
			} else {
				watcher.twitter.getHomeTimelineLastCachedId(watcher.account.userId)
					.then(function(id) {
						watcher.homeTimelineLastTweetId = id;
						resolve(id);
					});
			}
		});
	}

	start() {
		const watcher = this;

		if (!super.start()) {
			return;
		}

		console.log('starting to watch account', this.account);

		this.stream = this.twitter.api.getUserStream(this.account.token);
		this.stream.on('data', this.handleStreamData.bind(this));
		this.stream.start();

		this.streamCheckInterval = setInterval(this.streamCheck.bind(this), STREAM_CHECK_TIMEOUT);

		this.getHomeTimelineLastTweetId()
			.then(function(id) {
				watcher.twitter
					.getHomeTimeline(watcher.account.userId, watcher.account.token, id)
					.catch(function(e) {
						if (401 === e.status) {
							watcher.handleTokenRevoke();
						}
					})
					.then(function(tweets) {
						if (Array.isArray(tweets)
							&& tweets.length
						) {
							const tweet = tweets.shift();
							watcher.homeTimelineLastTweetId = tweet.id;
						}
					});
			});
	}

	stop() {
		super.stop();

		console.log('account watch stopped', this.account);

		clearInterval(this.streamCheckInterval);
		this.streamCheckInterval = null;

		this.stream.stop();
	}

	streamCheck() {
		const updateDiff = Date.now() - this.stream.lastUpdateTime;
		if (updateDiff > STREAM_CHECK_TIMEOUT
			|| this.stream.errorsCount > 0
		) {
			console.warn('stream distrust, restarting', {
				lastUpdateDiff: updateDiff,
				errorsCount: this.stream.errorsCount
			});

			this.restart();
		}
	}

	handleTweet(tweet) {
		const watcher = this;

		this.twitter
			.updateTweet(tweet, null, true)
			.then(function(tweet) {
				watcher.homeTimelineLastTweetId = tweet.id;

				// do not add retweet to timeline if we already have its source
				// @todo also check we have no retweets for the same source yet (tweet.retweeted index)
				if (tweet.retweetedId) {
					return this.twitter
						.getTweetById(tweet.retweetedId)
						.then(function(retweet) {
							if (retweet
								&& Array.isArray(retweet.timelineUserIds)
								&& retweet.timelineUserIds.indexOf(watcher.account.userId) >= 0
							) {
								console.info(
									'already have retweet in timeline, skipping',
									tweet,
									retweet
								);

								return null;
							}

							return tweet;
						});
				} else {
					return tweet;
				}
			})
			.then(function(tweet) {
				if (!tweet) {
					return null;
				}

				tweet
					.addTimelineUserId(watcher.account.userId)
					.save(watcher.twitter.db);  // @todo rethink this shit
			});
	}

	handleTweetDelete(id) {
		const watcher = this;

		this.twitter.deleteTweet(id);
	}

	handleStreamFriendsList(idsList) {
		const watcher = this;

		this.twitter
			.flushFriendShip(this.account.userId)
			.then(function() {
				return Promise.all(
					idsList.map(id => {
						return watcher.twitter
							.updateFriendShip(watcher.account.userId, id);
					})
				);
			});
	}

	handleUserFollow(userIdsList) {
		const [fromUserId, toUserId] = userIdsList;

		return this.twitter
			.updateFriendShip(fromUserId, toUserId);
	}

	handleUserUnfollow(userIdsList) {
		const [fromUserId, toUserId] = userIdsList;

		return this.twitter
			.updateFriendShip(fromUserId, toUserId, false);
	}

	handleTokenRevoke() {
		console.warn('token is revoked, stopping watcher');

		this.account.unauthorize();
		this.stop();
	}

	handleStreamData(type, data) {
		switch (type) {
			case TwitterStream.TYPE_TOKEN_REVOKED:
				this.handleTokenRevoke();
				break;
			case TwitterStream.TYPE_TWEET:
				this.handleTweet(data);
				break;
			case TwitterStream.TYPE_FRIENDS_LIST:
				this.handleStreamFriendsList(data);
				break;
			case TwitterStream.TYPE_DELETE_TWEET:
				this.handleTweetDelete(data);
				break;
			case TwitterStream.TYPE_FOLLOW:
				this.handleUserFollow(data);
				break;
			case TwitterStream.TYPE_UNFOLLOW:
				this.handleUserUnfollow(data);
				break;
			default:
				console.warn('unhandled stream data update', type, data);
		}
	}
}
