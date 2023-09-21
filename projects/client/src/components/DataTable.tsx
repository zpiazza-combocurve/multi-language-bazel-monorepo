import { faCheckSquare, faSquare } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FontIcon, DataTable as MdDataTable, DataTableProps as MdDataTableProps } from 'react-md';
import AutoSizer from 'react-virtualized-auto-sizer';

interface DataTableProps extends MdDataTableProps {
	overflow?: boolean;
}

/**
 * - Use the overflow property to make the header fixed to the top
 *
 * @deprecated Use material-ui
 * @see react-md DataTable component: https://react-md.mlaursen.com/components/data-tables
 */
function DataTable({ className, overflow, ...props }: DataTableProps) {
	const sharedProps = {
		uncheckedIcon: (
			<FontIcon>
				<FontAwesomeIcon icon={faSquare} />
			</FontIcon>
		),
		checkedIcon: (
			<FontIcon>
				<FontAwesomeIcon icon={faCheckSquare} />
			</FontIcon>
		),
	};

	if (!overflow) {
		return <MdDataTable className={className} {...sharedProps} {...props} />;
	}

	return (
		<div
			className={className}
			css={`
				overflow: hidden;
			`}
		>
			<AutoSizer>
				{({ width, height }) => (
					<MdDataTable
						css={`
							thead td,
							thead th {
								background: ${({ theme }) => theme.palette.background.default};
								top: 0;
								position: sticky;
								z-index: 1;
							}
						`}
						{...sharedProps}
						{...props}
						style={{ width, height }}
						fixedHeight={height}
						fixedWidth={width}
						responsive
					/>
				)}
			</AutoSizer>
		</div>
	);
}

export default DataTable;
