import { faSearch } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';

import { Box, Button, Divider, Icon, Tab, Tabs } from '@/components/v2';
import theme from '@/helpers/styled';

import { PageSearch } from './PageSearch';

type ReportSideBarProps = {
	reportPages: { [key: string]: string };
	onPageClick: (pageName: string) => void;
};
export const NavigationBar = ({ reportPages, onPageClick }: ReportSideBarProps) => {
	const [indexPage, setActivePage] = useState(0);
	const [search, setSearch] = useState<boolean>(false);

	const handleChange = (event, newValue: number) => {
		setActivePage(newValue);
	};

	const handleSearch = () => {
		setSearch((search) => !search);
	};

	return (
		<Box
			sx={{ height: '50px', width: '100%', bgcolor: theme.backgroundOpaque, overflow: 'hidden', display: 'flex' }}
		>
			<Button
				css={`
					width: 25px;
					alignitems: center;
					justifycontent: center;
				`}
				onClick={() => {
					handleSearch();
				}}
			>
				<Icon fontSize='small'>{faSearch}</Icon>
			</Button>
			{!search && <Divider orientation='vertical' flexItem />}
			{search && (
				<>
					<PageSearch reportPages={reportPages} onPageClick={onPageClick} changeActivePage={setActivePage} />
					<Divider orientation='vertical' flexItem />
				</>
			)}
			<Tabs
				value={indexPage}
				onChange={handleChange}
				variant='scrollable'
				scrollButtons='on'
				aria-label='scrollable auto tabs example'
			>
				{Object.keys(reportPages).map((pageName, index) => {
					return (
						<Tab
							key={index}
							label={pageName}
							onClick={() => {
								onPageClick(pageName);
							}}
							wrapped
							style={{ fontSize: '11px' }}
						/>
					);
				})}
			</Tabs>
		</Box>
	);
};
