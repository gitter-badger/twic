import React from 'react';

import './userInfo.styl';

import Avatar from '../../../components/avatar';
import Map from '../../../components/map';

import i18n from '../../../../i18n';

export default class UserInfo extends React.Component {
	render() {
		const user = this.props.user;

		return (
			<div id="profile" className="page">
				<Avatar template={user.avatar} type={Avatar.TYPE_BIG} />
				<div className="profile-badges">
					{user.isProtected     // @todo move to ul
						&& <i className="ei-lock ei-lock-dims"
							title={i18n.translate('pages.user.protected')} />
					}
					{user.isVerified
						&& <i className="ei-check ei-check-dims"
							title={i18n.translate('pages.user.verified')} />
					}
				</div>

				<ul id="info">
					<li>
						{user.name ? user.name : ''}
						{user.name !== user.screenName ? ' [' + user.screenName + ']' : ''}
					</li>
					{user.url ? <li dangerouslySetInnerHTML={{__html: user.url }} /> : ''}
					{user.description ? <li id="info-description">{user.description}</li> : ''}
					{user.location ? <li>{user.location}</li> : ''}
					{user.coords ? <Map coords={user.coords} locale={chrome.app.getDetails().current_locale} /> : ''}
				</ul>
			</div>
		);
	}
}
