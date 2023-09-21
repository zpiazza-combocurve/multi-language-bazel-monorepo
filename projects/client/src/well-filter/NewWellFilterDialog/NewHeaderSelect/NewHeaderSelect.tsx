import { styled } from '@material-ui/core';
import { useCallback, useMemo } from 'react';

import { ColoredCircle } from '@/components/misc';
import MultiSelectField from '@/components/v2/misc/MultiSelectField';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

const GroupHeader = styled('div')(({ theme }) => ({
	position: 'sticky',
	top: '-8px',
	padding: '15px 10px',
	zIndex: 1,
	backgroundColor: theme.palette.background.default,
	borderBottom: `1px solid ${theme.palette.divider}`,
	marginBottom: '1rem',
}));

const GroupItems = styled('ul')(() => ({
	padding: 0,
	paddingBottom: '1rem',
}));

export const HeaderSelect = ({ selectedHeaders, wellHeaders, projectHeaders, onHeaderSelectChange }) => {
	const menuItems = useMemo(() => {
		const wellHeaderItems = Object.keys(wellHeaders).map((header) => ({
			label: wellHeaders[header],
			value: header,
		}));
		const projectHeaderItems = Object.keys(projectHeaders).map((header) => ({
			label: projectHeaders[header],
			value: header,
		}));
		return [...projectHeaderItems, ...wellHeaderItems];
	}, [wellHeaders, projectHeaders]);

	const handleChange = useCallback(
		(selectedHeaders) => {
			const wellHeadersList: string[] = [];
			const projectHeadersList: string[] = [];
			selectedHeaders.forEach((header) => {
				if (projectHeaders[header]) {
					projectHeadersList.push(header);
				} else {
					wellHeadersList.push(header);
				}
			});
			onHeaderSelectChange(wellHeadersList, projectHeadersList);
		},
		[projectHeaders, onHeaderSelectChange]
	);

	const groupBy = useCallback(
		(option) => {
			if (projectHeaders[option]) {
				return 'Project Headers';
			}
			return 'Well Headers';
		},
		[projectHeaders]
	);

	return (
		<MultiSelectField
			menuItems={menuItems}
			variant='outlined'
			disableTags
			label='Filter By Headers'
			value={selectedHeaders}
			onChange={handleChange}
			renderBeforeOptionLabel={(value) =>
				projectHeaders[value] ? <ColoredCircle $color={projectCustomHeaderColor} /> : null
			}
			onTextFieldKeyDown={(event) => {
				if (event.key === 'Backspace') {
					event.stopPropagation();
				}
			}}
			groupBy={groupBy}
			renderGroup={(params) => (
				<li>
					<GroupHeader>{params.group}</GroupHeader>
					<GroupItems>{params.children}</GroupItems>
				</li>
			)}
		/>
	);
};
