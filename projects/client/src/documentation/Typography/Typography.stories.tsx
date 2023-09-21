import { Variant as VariantType } from '@material-ui/core/styles/createTypography';

import { Typography } from '@/components/v2';

import mdx from './Typography.mdx';

export default {
	title: 'Documentation/Typography',
	component: Typography,
	parameters: {
		docs: {
			page: mdx,
		},
	},
};

const variants: VariantType[] = [
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'subtitle1',
	'subtitle2',
	'body1',
	'body2',
	'caption',
	'button',
	'overline',
];

export const Variant = () => (
	<div>
		{variants.map((variant) => (
			<Typography key={variant} display='block' variant={variant} gutterBottom>
				{variant}
			</Typography>
		))}
	</div>
);
