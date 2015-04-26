import chai from 'chai';
const assert = chai.assert;

import HashtagEntities from '../../../src/background/entities/hashtag';

describe('Model.Entities.Hashtag', function() {

	it('should transform hashtags to spans', function() {
		const entities = [
			{
				text: 'hashtag'
			}
		];

		const result = HashtagEntities.processText(
			'testing #hashtag processing',
			entities
		);

		assert.equal(
			result,
			'testing <span class="tweet-link-hashtag">#hashtag</span> processing'
		);
	});

	it('should work with case insensitive data', function() {
		const entities = [
			{
				text: 'hashtag'
			}
		];

		const result = HashtagEntities.processText(
			'testing #HashTag processing',
			entities
		);

		assert.equal(
			result,
			'testing <span class="tweet-link-hashtag">#HashTag</span> processing'
		);
	});

});
