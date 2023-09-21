import { Button } from '@/components/v2';

export const MainButton = ({ children, ...props }) => (
	<Button {...props} css='color: #292929' color='secondary' variant='contained'>
		{children}
	</Button>
);
