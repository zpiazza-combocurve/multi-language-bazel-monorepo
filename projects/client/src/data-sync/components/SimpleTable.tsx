import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';
import { Skeleton } from '@material-ui/lab';
import { useState } from 'react';
import styled from 'styled-components';

import { Box, Typography } from '@/components/v2';

import { TextButton } from '../components/TextButton';

const GroupHeaderName = styled(Typography).attrs({
	variant: 'subtitle2',
})`
	margin-right: ${({ theme }) => theme.spacing(1)}px;
	font-size: 16px;
`;

const GroupCountBadge = styled(Box)`
	font-size: 13px;
	font-weight: 500;
	display: flex;
	justify-content: center;
	align-items: center;
	line-height: 1.5;
	background-color: ${({ theme }) => theme.palette.secondary.main};
	border-radius: 16px;
	padding: 2px 8px;
	min-width: 32px;
	color: ${({ theme }) => theme.palette.background.default};
`;

const useStyles = makeStyles({
	tableRow: {
		borderBottom: 'none',
		padding: 6,
	},
	tableHead: {
		background: 'rgba(255,255,255,0.08)',
		padding: 8,
	},
	table: {
		flex: '0.35 1 auto',
		background: 'var(--background-opaque)',
		padding: 16,
		maxHeight: 435,
	},
	head: {
		display: 'flex',
		justifyContent: 'space-between',
	},
});
const ItemFieldText = styled(Typography).attrs({
	variant: 'body2',
	noWrap: true,
})<{ $bold?: boolean; $right?: boolean }>`
	font-size: 12px;
	font-weight: ${({ $bold }) => ($bold ? 'bold' : 'normal')};
	text-align: ${({ $right }) => ($right ? 'end' : 'start')};
`;

const ItemHeaderText = styled(ItemFieldText)`
	font-weight: bold;
	color: ${({ theme }) => theme.palette.text.hint};

	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
`;

const EmptyBox = styled(Box)`
	maxheight: 356px;
	display: flex;
	justifycontent: center;
	margin: 16px;
`;

const defaultGetValue = ({ value }) => value;

type Column = {
	id?: string;
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getValue?: any;
	key: string;
};

type SimpleTableProps = {
	name: string;
	columns: Column[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	data: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onClick: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	onClickDetail: any;
	count?: number;
	loadingCount?: boolean;
	loading?: boolean;
};

export const SimpleTable: React.FC<SimpleTableProps> = ({
	name,
	columns,
	data,
	onClick,
	onClickDetail,
	count,
	loadingCount,
	loading,
}) => {
	const classes = useStyles();
	const emptyItems = data?.length === 0;
	const [selected, setSelected] = useState(undefined);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const handleClick = (row: any) => {
		onClickDetail?.(row);
	};
	const handleMouseEnter = (row) => {
		setSelected(row.id);
	};

	const handleMouseLeave = () => {
		setSelected(undefined);
	};

	return (
		<Paper className={classes.table}>
			<Box className={classes.head}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<GroupHeaderName>{name}</GroupHeaderName>
					{!!count && <GroupCountBadge>{count}</GroupCountBadge>}
					{loadingCount && <Skeleton animation='wave' height={30} width={30} />}
				</Box>
				<TextButton onClick={onClick}>See all</TextButton>
			</Box>
			{loading && (
				<>
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
					<Skeleton animation='wave' height={30} />
				</>
			)}
			{!loading && (
				<TableContainer>
					<Table className={classes.table} aria-label='simple table'>
						<TableHead className={classes.tableHead}>
							<TableRow>
								{columns.map((column) => (
									<TableCell key={column.name} className={classes.tableRow}>
										<ItemHeaderText> {column.name}</ItemHeaderText>
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{!emptyItems &&
								data.map((row) => (
									<TableRow
										key={row.name}
										onMouseEnter={() => handleMouseEnter(row)}
										onMouseLeave={handleMouseLeave}
										onClick={() => handleClick(row)}
										selected={row.id === selected}
									>
										{columns.map((el) => (
											<TableCell className={classes.tableRow} key={el.id}>
												<ItemFieldText>
													{(el?.getValue ?? defaultGetValue)?.({ value: row[el.key] })}
												</ItemFieldText>
											</TableCell>
										))}
									</TableRow>
								))}
							{emptyItems && (
								<EmptyBox>
									<ItemHeaderText>No data to show</ItemHeaderText>
								</EmptyBox>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Paper>
	);
};
