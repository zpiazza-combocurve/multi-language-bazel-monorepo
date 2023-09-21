import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Checkbox } from '@/components/v2';

export default {
	title: 'Components/Checkbox',
	component: Checkbox,
} as ComponentMeta<typeof Checkbox>;

const Template: ComponentStory<typeof Checkbox> = (args) => <Checkbox {...args} />;

export const Basic = Template.bind({});

Basic.args = {
	checked: true,
	disabled: false,
};
