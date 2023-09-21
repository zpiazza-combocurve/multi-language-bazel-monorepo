import React from 'react';

import { TestWrapper } from '@/helpers/testing';

const withTheme = (StoryFn) => {
	return (
		<TestWrapper>
			<StoryFn />
		</TestWrapper>
	);
};

export const decorators = [withTheme];
