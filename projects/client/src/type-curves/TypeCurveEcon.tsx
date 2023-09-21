import { Paper } from '@material-ui/core';
import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';

import { SUBJECTS } from '@/access-policies/Can';
import usePermissions from '@/access-policies/usePermissions';
import ErrorBoundary from '@/components/ErrorBoundary';
import { EconSettingsDialog } from '@/economics/EconSettingsDialog';
import { addColumnForPDF } from '@/economics/shared/shared';
import EconOutputMonthlyTable from '@/economics/tables/EconOutputMonthlyTable';
import { genericErrorAlert, useLoadingBar } from '@/helpers/alerts';
import { useAlfa } from '@/helpers/alfa';
import { useDialog } from '@/helpers/dialog';
import { fields } from '@/inpt-shared/display-templates/general/economics_columns.json';

import TypeCurveAssumptions from './TypeCurveEcon/TypeCurveAssumptions';
import TypeCurveEconOneLiner from './TypeCurveEcon/TypeCurveEconOneLiner';
import * as api from './TypeCurveEcon/api';
import { useTypeCurve } from './api';

import './TypeCurveEcon/TypeCurveEcon.scss';

function PaperPlaceholder({ children }) {
	return (
		<div
			css={`
				color: ${({ theme }) => theme.palette.text.hint};
				text-align: center;
			`}
		>
			<div
				css={`
					font-size: 1.5rem;
				`}
			>
				{children}
			</div>
			<div>Run to see output</div>
		</div>
	);
}

function Monthly({ error, monthly }) {
	if (error) {
		return <h5 className='warn-icon'>Error: {error} </h5>;
	}

	if (monthly && monthly.length) {
		return <EconOutputMonthlyTable css='height: 100%;' output={monthly} />;
	}

	return <PaperPlaceholder>Monthly</PaperPlaceholder>;
}

function Oneliner({ error, oneLiner, monthly, typeCurve }) {
	if (error) {
		return <h5 className='warn-icon'>Error: {error} </h5>;
	}

	if (oneLiner) {
		return (
			<TypeCurveEconOneLiner css='height: 100%;' oneLiner={oneLiner} monthly={monthly} typeCurve={typeCurve} />
		);
	}

	return <PaperPlaceholder>One Liner</PaperPlaceholder>;
}

type TypeCurveEconRunResult = {
	monthly: Inpt.EconRun['outputGroups']['all'];
	oneLiner: Inpt.EconRunData['oneLinerData'];
};

export function EconTypeCurve({ typeCurveId }: { typeCurveId: string }) {
	// state
	const { project } = useAlfa();

	const typeCurveQuery = useTypeCurve(typeCurveId);
	const { data: typeCurve, error: typeCurveError, isLoading: loadingTypeCurve } = typeCurveQuery;
	const [result, setResult] = useState<TypeCurveEconRunResult | null>(null);
	const monthly = result?.monthly;
	const oneLiner = result?.oneLiner;

	// actions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const { mutateAsync: runEcon, isLoading: runningEcon } = useMutation(async (input: Record<string, any>) => {
		const output = await api.runTypeCurveEcon({ typeCurveId, input });

		if (output.error) {
			genericErrorAlert(output.error);
			return;
		}

		setResult(output);
	});

	const [econSettingsDialog, promptEconSettingsDialog] = useDialog(EconSettingsDialog);

	const handleRun = useCallback(
		async (_assumptions, headers, pSeries) => {
			// ToDo: check required types for EconSettingsDialog props
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const setting = await promptEconSettingsDialog({ runText: 'Run Economics' } as any);
			if (!setting) {
				return;
			}
			const input = {
				headers: {
					...headers,
					first_prod_date: new Date(headers.first_prod_date).toISOString(),
				},
				pSeries,
				typeCurveId,
				columns: addColumnForPDF(setting.columns),
				columnFields: fields,
				wellCalcs: {},
			};
			runEcon(input);
		},
		[runEcon, promptEconSettingsDialog, typeCurveId]
	);

	// effects
	useLoadingBar(runningEcon);

	const { canUpdate: canUpdateTypeCurve } = usePermissions(SUBJECTS.TypeCurves, typeCurve?.project);

	if (loadingTypeCurve) {
		return null;
	}

	return (
		<ErrorBoundary>
			{econSettingsDialog}
			<section
				css={`
					height: 100%;
					display: flex;
					flex-direction: row;
					gap: ${({ theme }) => theme.spacing(2)}px;
					padding: ${({ theme }) => theme.spacing(2)}px;
				`}
			>
				<TypeCurveAssumptions
					onRunEcon={handleRun}
					canUpdateTypeCurve={canUpdateTypeCurve}
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					project={project!}
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					typeCurve={typeCurve!}
					/* setParentState={SetState} */
				/>
				<Paper
					id='econ-output-oneliner'
					css={`
						flex: 1;
					`}
				>
					<Oneliner error={typeCurveError} oneLiner={oneLiner} monthly={monthly} typeCurve={typeCurve} />
				</Paper>
				<Paper
					id='econ-output-monthly'
					css={`
						flex: 3;
					`}
				>
					<Monthly error={typeCurveError} monthly={monthly} />
				</Paper>
			</section>
		</ErrorBoundary>
	);
}
