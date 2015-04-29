import React from 'react';

import moment from '../moment';

import './timeAgo.styl';

export default class TimeAgo extends React.Component {
	constructor(props) {
		super(props);

		this.timer = null;
		this.state = {
			text: '',
			hint: '',
			timeout: 1000
		};
	}

	render() {
		return (
			<div className="timeago" title={this.state.hint}>{this.state.text}</div>
		);
	}

	recalculateText() {
		const momentObject = moment(this.props.timestamp);

		this.setState({
			text: momentObject.fromNow(),
			hint: momentObject.calendar()
		});
	}

	setup(timestamp) {
		const offset = Date.now() - this.props.timestamp;
		let timeout;

		if (this.timer) {
			clearInterval(this.timer);
		}

		this.recalculateText();

		if (offset < 60 * 1000) { // less than minute
			timeout = 1000;
		} else
		if (offset < 60 * 60 * 1000) { // less than hour
			timeout = 60 * 1000;
		// } else
		// if (offset < 24 * 60 * 60 * 1000) { // less than day
		// 	timeout = 60 * 60 * 1000;
		} else {
			timeout = null;
		}

		this.setState({
			timeout
		});

		if (timeout) {
			this.timer = setInterval(() => this.recalculateText(), timeout);
		}
	}

	componentWillReceiveProps(nextProps, nextState) {
		this.setup(nextProps.timestamp);
	}

	componentWillMount() {
		this.setup(this.props.timestamp);
	}

	componentWillUnmount() {
		if (this.timer) {
			clearInterval(this.timer);
		}
	}
}

TimeAgo.propTypes = {
	timestamp: React.PropTypes.number
};