import { Autocomplete, Box } from '@/components/v2';
import theme from '@/helpers/styled';

type PageSearchProps = {
	reportPages: { [key: string]: string };
	onPageClick: (pageName: string) => void;
	changeActivePage: (pageIndex: number) => void;
};

export const PageSearch = ({ reportPages, onPageClick, changeActivePage }: PageSearchProps) => {
	//Goes to selected page and manages the navbar page highlight
	const handlePageSelection = (pageName) => {
		//Change current page to pageName
		onPageClick(pageName);

		const pages = Object.keys(reportPages);
		const pageIndex = pages.indexOf(pageName);
		changeActivePage(pageIndex);
	};

	return (
		<Box
			sx={{
				height: '50px',
				width: '350px',
				bgcolor: theme.backgroundOpaque,
				display: 'flex',
				marginLeft: '10px',
				marginRight: '10px',
				alignItems: 'center',
				justifyContent: 'center',
				alignSelf: 'center',
				alignContent: 'center',
			}}
		>
			<Autocomplete
				id='country-select-demo'
				css={`
					width: 300px;
				`}
				options={Object.keys(reportPages)}
				autoHighlight
				getOptionLabel={(option) => option}
				onChange={(event, value) => handlePageSelection(value)}
				renderOption={(option) => <Box component='li'>{option}</Box>}
				label='Pages'
			/>
		</Box>
	);
};
