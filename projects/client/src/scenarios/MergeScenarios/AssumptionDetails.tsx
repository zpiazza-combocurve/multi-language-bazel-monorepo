import { faCheck, faChevronDown, faChevronUp, faExclamationTriangle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Divider, IconButton, ListItem, Typography } from '@/components/v2';
import { theme } from '@/helpers/styled';
import { QUALIFIER_FIELDS } from '@/qualifiers/fields';

import MergeAssumptionQualifiersWorkspace from './MergeAssumptionQualifiersWorkspace';
import { MAX_NUMBER_OF_MERGED_QUALIFIERS } from './constants';
import styles from './merge-scenarios.module.scss';
import { AssumptionWithQualifiers, MergeScenariosModel, MergedQualifier } from './models';

const AssumptionDetails = ({
	assumptionDetails,
	mergedModel,
	onExpand,
	onCollapse,
	addMergedQualifiers,
	updateMergedQualifier,
	deleteMergedQualifier,
}: {
	assumptionDetails: AssumptionWithQualifiers;
	mergedModel: MergeScenariosModel;
	onExpand: (assumption: string) => void;
	onCollapse: (assumption: string) => void;
	addMergedQualifiers: (updates: { assumption: string; qualifiersToAdd: MergedQualifier[] }[]) => void;
	updateMergedQualifier: (assumption: string, updatedQualifier: MergedQualifier) => void;
	deleteMergedQualifier: (assumption: string, key: string) => void;
}) => {
	const assumptionMergedQualifiers = mergedModel.assumptions[assumptionDetails.key].qualifiers;
	const mergedCount = assumptionMergedQualifiers.length;
	const qualifiersNumberExceeded = assumptionMergedQualifiers.length > MAX_NUMBER_OF_MERGED_QUALIFIERS;

	let warning = qualifiersNumberExceeded ? 'Merge or Remove some of the Qualifiers' : '';

	if (!warning) {
		const mergedQualifiersNames = assumptionMergedQualifiers.map((q) => q.name);
		const allNamesAreUnique = new Set(mergedQualifiersNames).size === assumptionMergedQualifiers.length;

		if (!allNamesAreUnique) {
			warning = 'Qualifiers names should be unique';
		}
	}

	return (
		<ListItem key={assumptionDetails.key} className={styles['assumption-details']}>
			<div
				css={warning ? `border: 1px ${theme.warningAlternativeColor} solid` : undefined}
				className={styles['assumption-merge-header']}
			>
				<div className={styles['merge-info']}>
					<Typography>{QUALIFIER_FIELDS[assumptionDetails.key]}</Typography>
					<div className={styles['qualifiers-info']}>
						{warning && (
							<>
								<Typography className={styles['qualifiers-p']}>{warning}</Typography>
								<FontAwesomeIcon
									className={styles['assumption-status-icon']}
									color={theme.warningAlternativeColor}
									size='lg'
									icon={faExclamationTriangle}
								/>
							</>
						)}
						{!warning && (
							<FontAwesomeIcon
								className={styles['assumption-status-icon']}
								color={theme.primaryColor}
								size='lg'
								icon={faCheck}
							/>
						)}
						<Typography className={styles['qualifiers-p']}>
							{mergedCount}/{MAX_NUMBER_OF_MERGED_QUALIFIERS} Qualifiers
						</Typography>
					</div>
				</div>
				<div className={styles.toggle}>
					<Divider orientation='vertical' />
					<IconButton
						size='small'
						onClick={() =>
							assumptionDetails.expanded
								? onCollapse(assumptionDetails.key)
								: onExpand(assumptionDetails.key)
						}
					>
						{assumptionDetails.expanded ? faChevronUp : faChevronDown}
					</IconButton>
				</div>
			</div>
			{assumptionDetails.wasExpanded && (
				<MergeAssumptionQualifiersWorkspace
					assumptionDetails={assumptionDetails}
					mergedScenarioName={mergedModel.name}
					order={mergedModel.scenarios}
					mergedScenarioQualifiers={assumptionMergedQualifiers}
					addMergedQualifiers={addMergedQualifiers}
					updateMergedQualifier={updateMergedQualifier}
					deleteMergedQualifier={deleteMergedQualifier}
				/>
			)}
		</ListItem>
	);
};

export default AssumptionDetails;
