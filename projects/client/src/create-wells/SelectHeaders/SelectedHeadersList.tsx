import { faTrashAlt } from '@fortawesome/pro-regular-svg-icons';

import ColoredCircle from '@/components/misc/ColoredCircle';
import { Divider, IconButton, List, ListItem, Typography } from '@/components/v2';
import WellHeaderInput from '@/create-wells/WellHeaderInput';
import { CreateGenericWellsHeaderModel, WellHeaderInfo, WellHeaderValue } from '@/create-wells/models';
import { projectCustomHeaderColor } from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import styles from './select-headers.module.scss';

interface SelectedHeadersListProps {
	wellHeadersDict: Record<string, WellHeaderInfo>;
	headers: CreateGenericWellsHeaderModel[];
	errors?: Record<string, string>;
	onRemoveHeader: (key: string | undefined) => void;
	onChangeHeaderValue: (key: string, value: WellHeaderValue) => void;
}

const SelectedHeadersList = (props: SelectedHeadersListProps) => {
	const { wellHeadersDict, headers, onRemoveHeader, onChangeHeaderValue, errors } = props;

	return (
		<div className={styles['headers-list']}>
			<List>
				{headers.map((h, i) => {
					return (
						<ListItem key={h.key}>
							<div className={styles['input-controls']}>
								<Typography className={styles['header-label']}>
									<>
										{wellHeadersDict[h.key].isPCH && (
											<ColoredCircle $color={projectCustomHeaderColor} />
										)}
										{wellHeadersDict[h.key].label}
									</>
								</Typography>
								<WellHeaderInput
									type={wellHeadersDict[h.key].type}
									field={h.key}
									value={h.value}
									helperText={errors?.[h.key]}
									onChange={onChangeHeaderValue}
									label={wellHeadersDict[h.key].label}
									options={wellHeadersDict[h.key].options}
									inputCss='flex: 1; margin-right: 24px;'
								/>
								<div className={styles['delete-wrapper']}>
									<IconButton css='padding: 8px;' onClick={() => onRemoveHeader(h.key)}>
										{faTrashAlt}
									</IconButton>
								</div>
							</div>
							{headers.length - 1 !== i && <Divider orientation='horizontal' />}
						</ListItem>
					);
				})}
			</List>
		</div>
	);
};

export default SelectedHeadersList;
