import { useMemo, useState } from 'react';

const expandStyles = {
	zIndex: 100,
	position: 'absolute',
	width: '74vw',
	height: '94%',
};

export const Expandable = ({ isExpanded, children, style = {}, onChange }) => {
	const [expanded, expand] = useState(isExpanded);

	const combinedStyles = useMemo(
		() => ({
			...expandStyles,
			...style,
		}),
		[style]
	);
	const controlled = typeof isExpanded === 'undefined' ? expanded : isExpanded;
	return children({
		isExpanded: controlled,
		toggleExpand: () => (onChange ? onChange() : expand((el) => !el)),
		expandStyles: isExpanded ? combinedStyles : {},
	});
};
