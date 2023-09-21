import { faUmbrella } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ContextMenu, SEPARATOR } from '@/components/ContextMenu';
import { withDialog } from '@/helpers/dialog';
import { QualifierSaveDialog, generateDefaultName } from '@/qualifiers';
import { useSorting } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/useSorting';

import { useColumnOptions } from '../../../../components/AgGrid/WellHeaderComponent/useColumnOptions';
import { useWellTableSelection } from '../../hooks/useWellTableSelection';
import { StatusChooser } from './StatusChooser';

const showCreateDialog = withDialog(QualifierSaveDialog);
const showStatusChooserDialog = withDialog(StatusChooser);

const COLUMN = 'status';

export function SchedulingStatusHeaderComponent(props) {
	const umbrellas = props.umbrellas || [];
	const selected = props.selectedUmbrellaId ? umbrellas.find(({ _id }) => _id === props.selectedUmbrellaId) : null;

	const handleCreateQualifier = async () => {
		const newQualifierName = await showCreateDialog({
			initialName: generateDefaultName(COLUMN, umbrellas),
			umbrellas,
		});

		if (newQualifierName) {
			props.context.onCreateQualifier({ name: newQualifierName, column: COLUMN });
		}
	};

	const { sortDirectionIndicator, sortIndexIndicator, onSortChange } = useSorting(props);

	const { pinMenuItem, autoSizeMenuItems, groupMenuItems } = useColumnOptions(props);

	const selection = useWellTableSelection();

	return (
		<div
			css={`
				height: 100%;
				width: calc(100% + 2rem);
				display: flex;
				flex-direction: column;
				margin: 0 -1rem;
				& > * {
					flex: 1;
					display: flex;
					align-items: center;
					&:not(:first-child) {
						border-width: 1px;
						border-color: #dde2eb;
						border-top-style: solid;
					}
				}
			`}
		>
			<div>
				<div
					onClick={onSortChange}
					css={`
						flex: 1;
						padding: 0 1rem;
						display: flex;
						overflow: hidden;
						& > * {
							flex: 0 0 auto;
						}
					`}
				>
					<div
						css={`
							flex: 1 1 0;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						`}
					>
						Scheduling Status
					</div>
					{sortIndexIndicator}
					{sortDirectionIndicator}
				</div>
				<ContextMenu
					items={() => [
						{
							label: 'Choose Status',
							onClick: () =>
								showStatusChooserDialog({
									onChoose: (value) => {
										props.context.handleChangeMultiCell(
											Array.from(selection.selectedSet),
											COLUMN,
											value
										);
									},
								}),
							disabled: selection.selectedSet.size === 0,
						},
						SEPARATOR,
						pinMenuItem,
						SEPARATOR,
						...autoSizeMenuItems,
						...(groupMenuItems ? [SEPARATOR, ...groupMenuItems] : []),
					]}
				/>
			</div>
			<div>
				<div
					css={`
						flex: 1;
						overflow: hidden;
						padding: 0 1rem;
					`}
				>
					<span>{selected ? selected.name : 'Default'}</span>
					<FontAwesomeIcon
						css={`
							margin-left: 0.3rem;
						`}
						className='right-btn-icon'
						icon={faUmbrella}
					/>
				</div>
				<ContextMenu
					items={[
						{
							label: 'New Qualifier...',
							disabled: !props.canUpdateSchedule,
							onClick: handleCreateQualifier,
						},

						...(umbrellas.length > 0 ? [{ separator: true }] : []),

						...umbrellas.map((umbrella) => ({
							label: umbrella.name,
							disabled: !props.canUpdateSchedule,
							onClick: () => props.context.onChangeQualifier(umbrella._id),
						})),
					]}
				/>
			</div>
		</div>
	);
}
