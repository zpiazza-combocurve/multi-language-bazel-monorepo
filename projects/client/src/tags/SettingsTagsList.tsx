import { InputLabel } from '@material-ui/core';

import { theme } from '@/helpers/styled';
import TagsList from '@/tags/TagsList';
import { useGetFeatTags } from '@/tags/queries';

const SettingsTagsList = ({ feat, featId }) => {
	const { data: featTags } = useGetFeatTags({ feat, featId });

	return (
		<div
			css={`
				flex-grow: 1;
				border-bottom: 1px solid ${theme.textColorOpaque};
			`}
		>
			<InputLabel shrink>Tags</InputLabel>
			<div>
				<TagsList tags={featTags} />
			</div>
		</div>
	);
};

export default SettingsTagsList;
