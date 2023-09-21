import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import produce from 'immer';
import { useCallback, useState } from 'react';
import styled, { css } from 'styled-components';

const ModelCount = styled.strong.attrs({ role: 'button' })`
	cursor: pointer;
	text-decoration: underline;
	transition: all 0.25s ease;

	&:active {
		position: relative;
		top: 1px;
	}

	&:hover {
		opacity: 0.85;
	}
`;

const ToggleIcon = styled(FontAwesomeIcon).attrs({ icon: faChevronRight })<{ expanded?: boolean }>`
	font-size: 0.85rem;
	transition: all 0.25s ease;

	${(props) =>
		props.expanded &&
		css`
			transform: rotate(90deg);
		`}
`;

const ModelRepercussion = ({ displayName, expanded, modelName, onToggleDetails, plural, usage }) => {
	const usageCount = Array.isArray(usage?.[modelName]) ? usage[modelName].length : 'all';

	const handleToggleDetails = useCallback(() => onToggleDetails(modelName), [onToggleDetails, modelName]);

	return (
		<div>
			Removes well{plural} from{' '}
			{usageCount ? (
				<ModelCount onClick={handleToggleDetails}>
					{usageCount} {displayName} {Number.isInteger(usageCount) && <ToggleIcon expanded={expanded} />}
				</ModelCount>
			) : (
				`0 ${displayName}`
			)}
		</div>
	);
};

const UsageDetailsList = styled.ul`
	list-style: none;
	transition: all 0.25s ease;

	& > :not(:first-child) {
		margin-top: ${({ theme }) => theme.spacing(2)}px;
	}
`;

const StyledDetailsItem = styled.li`
	display: flex;
	font-size: 0.9rem;

	& > * {
		display: flex;
		flex-basis: 100%;
		flex-grow: 1;
		flex-shrink: 1;
	}
`;

const UsageDetailsItem = ({ name, updatedAt }) => {
	return (
		<StyledDetailsItem>
			<span>{name}</span>
			<span>{new Date(updatedAt).toLocaleDateString()}</span>
		</StyledDetailsItem>
	);
};

const ModelList = ({ models }) => {
	if (!models.length) {
		return null;
	}
	return (
		<UsageDetailsList>
			<StyledDetailsItem>
				<strong>Name</strong>
				<strong>Last Updated</strong>
			</StyledDetailsItem>
			{models.map(({ name, updatedAt }) => (
				<UsageDetailsItem key={name} name={name} updatedAt={updatedAt} />
			))}
		</UsageDetailsList>
	);
};

const RepercussionListItem = ({ description, displayName, expanded, modelName, onToggleDetails, plural, usage }) => {
	const content = modelName ? (
		<ModelRepercussion
			displayName={displayName}
			expanded={expanded}
			modelName={modelName}
			onToggleDetails={onToggleDetails}
			plural={plural}
			usage={usage}
		/>
	) : (
		description
	);
	const models = usage?.[modelName] ?? [];

	return (
		<div>
			<ul>
				<li>{content}</li>
			</ul>
			{expanded && <ModelList models={models} />}
		</div>
	);
};

const removalItems = [
	{
		displayName: 'projects',
		modelName: 'projects',
	},
	{
		displayName: 'scenarios',
		modelName: 'scenarios',
	},
	{
		displayName: 'forecasts',
		modelName: 'forecasts',
	},
	{
		displayName: 'type curves',
		modelName: 'type-curves',
	},
	{
		displayName: 'schedules',
		modelName: 'schedules',
	},
	{
		displayName: 'econ models',
		description: `Removes all unique econ models made for these wells`,
	},
	{
		displayName: 'economic calculations',
		description: `Removes economic calculations that include these wells. Does not affect previously generated files`,
	},
	{
		displayName: 'carbon',
		description: 'removes wells from all Networks',
	},
];

function DeleteWellRepercussion({ usage, count }) {
	const [toggles, setToggles] = useState({});

	const handleToggleDetails = (key) => {
		setToggles(
			produce((draft) => {
				draft[key] = !draft[key];
			})
		);
	};

	return (
		<div>
			{removalItems.map(({ description, displayName, modelName }) => (
				<RepercussionListItem
					description={description}
					displayName={displayName}
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					expanded={toggles[modelName!]}
					key={displayName}
					modelName={modelName}
					onToggleDetails={handleToggleDetails}
					plural={count === 1 ? '' : 's'}
					usage={usage}
				/>
			))}
		</div>
	);
}

export default DeleteWellRepercussion;
