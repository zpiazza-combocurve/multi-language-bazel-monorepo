import { faPlus } from '@fortawesome/pro-regular-svg-icons';

import { Button as MUIButton } from '@/components/v2';

interface Props {
	onClick: () => void;
	feat: string;
	disabled?: boolean;
	tooltipTitle?: boolean | string;
}

const CreateButton = (props: Props) => {
	const { onClick, disabled, feat, tooltipTitle } = props;

	return (
		<MUIButton tooltipTitle={tooltipTitle} disabled={disabled} color='primary' startIcon={faPlus} onClick={onClick}>
			Create {feat}
		</MUIButton>
	);
};

export default CreateButton;
