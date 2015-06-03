import Model from '../../src/_chaos/background/model';

describe('Model', function() {
	it('should be marked as changed after markAsChanged called', function() {
		var m = new Model();

		assert.equal(m.isChanged(), false);

		m.markAsChanged();

		assert.equal(m.isChanged(), true);
		assert.property(m, 'updateTime');
		assert.equal(m.updateTime <= Date.now(), true);
	});
});
