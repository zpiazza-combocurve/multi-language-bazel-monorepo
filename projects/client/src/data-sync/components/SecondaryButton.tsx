import { Button } from '@/components/v2';

export const SecondaryButton = ({ children, ...props }) => (
	<Button {...props} color='secondary' variant='outlined'>
		{children}
	</Button>
);
