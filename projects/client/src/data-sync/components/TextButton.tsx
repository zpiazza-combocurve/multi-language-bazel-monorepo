import { Button } from '@/components/v2';

export const TextButton = ({ children, ...props }) => (
	<Button {...props} color='secondary'>
		{children}
	</Button>
);
