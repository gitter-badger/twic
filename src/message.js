export default class Message {
	constructor(type, data = null) {
		this.type = type;
		this.data = data;
	}

	send() {
		var message = this;

		return new Promise(function(resolve, reject) {
			console.debug('sending message', message);

			chrome.runtime.sendMessage({
				type: message.type,
				data: message.data
			}, function(reply) {
				console.debug('reply received', reply);
				resolve(reply);
			});
		});
	}
}

Message.TYPE_AUTH_START = 0;
Message.TYPE_AUTH_CHECK = 1;
Message.TYPE_AUTH = 2;
Message.TYPE_ACCOUNT_USERS = 3;
Message.TYPE_USER = 4;
