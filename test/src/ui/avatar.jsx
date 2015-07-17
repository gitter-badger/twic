import React from 'react/addons';

import Avatar from 'client/ui/avatar';

const TestUtils = React.addons.TestUtils;

describe('UI', () => describe('Avatar', () => {

	it('should render avatar to img with correct src', function() {
		const pathTemplate = 'file://somepath{size}.jpg';
		const component = TestUtils.renderIntoDocument(
			<Avatar template={pathTemplate} />
		);

		assert.ok(component);

		const div = TestUtils.findRenderedDOMComponentWithTag(component, 'img');
		assert.ok(div);

		const node = div.getDOMNode();
		assert.include(node.src, 'somepath');
		assert.notInclude(node.src, '{size}', 'size component replace');
	});

	it('should be bordered if property is set', function() {
		const pathTemplate = 'file://somepath{size}.jpg';
		const component = TestUtils.renderIntoDocument(
			<Avatar template={pathTemplate} border />
		);

		assert.ok(component);

		const div = TestUtils.findRenderedDOMComponentWithTag(component, 'img');
		assert.ok(div);

		const node = div.getDOMNode();
		assert.include(node.getAttribute('class'), 'border');
	});

}));
