import { useTheme } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useState } from 'react';

import { Button, ReactDatePicker, Typography } from '@/components/v2';

import { STATE } from '../NpvStepper';
import { ValidationCard } from '../ValidationCard';

const ParametersFormLoading = () => {
	return (
		<>
			<Skeleton animation='wave' height={30} />
			<Skeleton animation='wave' height={30} />
			<Skeleton animation='wave' height={40} />
		</>
	);
};

export const DefineParametersStep = ({ state, handleNext, validationErrors }) => {
	const theme = useTheme();

	const [startDate, setStartDate] = useState<Date | null>(new Date());

	const isLoading = state === STATE.LOADING;
	const isCalculating = state === STATE.CALCULATING;
	const isLocked = state === STATE.LOCKED;

	return (
		<div
			css={`
				display: flex;
				gap: 1rem;
			`}
		>
			<div
				css={`
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					width: 45%;
				`}
			>
				{isLoading && <ParametersFormLoading />}
				{!isLoading && (
					<>
						<Typography
							css={`
								font-weight: 300;
								font-size: 14px;
							`}
						>
							Single Well NPV calculates a priority of wells based on before taxes net present value at a
							10% discount rate (BFIT10).
						</Typography>
						<div
							css={`
								display: flex;
								margin-top: 1rem;
							`}
						>
							<ReactDatePicker
								css={`
									margin-right: 1rem;
								`}
								label='Start Date'
								name='startDate'
								variant='outlined'
								size='small'
								color='secondary'
								value={startDate ? startDate.toDateString() : undefined}
								onChange={(date) => setStartDate(date)}
								disabled={isCalculating || isLocked}
								required
								fullWidth
							/>
							<Button
								css={`
									color: ${theme.palette.background.default};
								`}
								color='secondary'
								variant='contained'
								onClick={handleNext}
								disabled={isCalculating || isLocked}
							>
								Calc
							</Button>
						</div>
					</>
				)}
			</div>
			{Boolean(validationErrors.validations.length) && (
				<ValidationCard
					css={`
						padding: 1rem;
						background: #404040;
						border-radius: 4px;
						width: 55%;
					`}
				>
					{validationErrors.validations.map(({ missing, model, details }, index) => {
						if (missing && model)
							return (
								<span key={index}>
									<strong>
										{missing} / {validationErrors.total} wells
									</strong>{' '}
									missing {model} Model
								</span>
							);
						return <span key={index}>{details}</span>;
					})}
				</ValidationCard>
			)}
		</div>
	);
};
