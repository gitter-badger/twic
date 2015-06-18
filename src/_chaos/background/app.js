import AccountList from 'core/struct/accountList';
import AccountWatcher from './accountWatcher';
import ConfigWatcher from './twitter/configWatcher';
import Message from '../message';

import i18n from 'i18n';
import connection from 'core/connection';

/** message handlers */
import UserInfoHandler from './handlers/userInfo';
import AccountListHandler from './handlers/accountList';
import AuthHandler from './handlers/auth';
import TimelineHandler from './handlers/timeline';
/** ---------------- */

const CONFIG_ACCOUNTS_KEY = 'accounts';

export default class App {
	constructor(config, twitter) {
		const app = this;

		this.config = config;
		this.twitter = twitter;

		this.accounts = null;

		this.messageHandlers = { };
	}

	start() {
		const app = this;
		const twitterConfigWatcher = new ConfigWatcher(this.config, this.twitter);
		twitterConfigWatcher.start();

		this.updateToolbar();
		connection.on('change', this.updateToolbar.bind(this));

		[
			UserInfoHandler,
			AccountListHandler,
			AuthHandler,
			TimelineHandler
		].forEach(HandlerClass => {
			const handler = new HandlerClass(app);
			this.messageHandlers[handler.getMessageType()] = handler;
		});

		this.config
			.get(CONFIG_ACCOUNTS_KEY)
			.then(data => {
				this.accounts = AccountList.unserialize(data);

				console.log('account list loaded', this.accounts);

				this.accounts.map(account => {
					const watcher = new AccountWatcher(app.twitter, account);
					if (account.isAuthorized()) {
						watcher.start();
					}
				});

				this.accounts.on('change', () => this.accounts.save(this.config));

				app.listen();
			});
	}

	listen() {
		console.log('listening for messages...');
		chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
	}

	updateToolbar() {
		const imagePrefix = 'images/toolbar' + (connection.connected ? '' : '.disconnected');
		const nameParts = [chrome.runtime.getManifest().name];

		if (!connection.connected) {
			nameParts.push(i18n.translate('toolbar.disconnected'));
		}

		chrome.browserAction.setIcon({
			path: {
				19: [imagePrefix, '.png'].join(''),
				38: [imagePrefix, '@2x', '.png'].join('')
			}
		});

		chrome.browserAction.setTitle({
			title: nameParts.join(' - ')
		});
	}

	handleMessage(message, sender, sendResponse) {
		const msg = new Message(message.type, message.data);
		let handler;
		let reply;

		console.log('message received', msg);

		if (undefined === this.messageHandlers[msg.type]) {
			console.error('unknown message type', msg.type);
		} else {
			let handlerReply = this.messageHandlers[msg.type].handle(msg.data);

			if (handlerReply instanceof Promise) {
				handlerReply.then(function(response) {
					sendResponse(response);
				});

				reply = true;
			} else {
				reply = handlerReply;
			}
		}

		return reply;
	}
}
