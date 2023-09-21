import { useState } from 'react';

import { Checkbox } from '@/components/v2';

export const HeaderCheckboxSelection = (props) => {
	const { selection, defaultChecked } = props;

	const [_checked, setChecked] = useState(defaultChecked ?? selection.allSelected);

	const checked = selection.allSelected ?? _checked;

	const handleOnChange = (event) => {
		if (event.target.checked) {
			selection.selectAll();
			setChecked(true);
		} else {
			selection.deselectAll();
			setChecked(false);
		}
	};

	return (
		<div
			css={`
				margin-left: -10px;
			`}
		>
			<Checkbox onChange={handleOnChange} checked={checked} />
		</div>
	);
};
