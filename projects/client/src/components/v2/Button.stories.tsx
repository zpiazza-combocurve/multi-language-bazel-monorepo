import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Button } from '@/components/v2';

export default {
	title: 'Components/Button',
	component: Button,
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Basic = Template.bind({});

Basic.args = {
	variant: 'outlined',
	color: 'secondary',
	size: 'small',
	disabled: false,
	children: 'Run',
	tooltipTitle: 'This is a tooltip',
};
