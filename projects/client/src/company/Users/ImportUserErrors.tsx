import { Alert, AlertTitle } from '@material-ui/lab';

import { Card, CardContent } from '@/components/v2';

import { UserImportLineError } from './MassImportUserDialog';

const ImportUserErrors = ({
	overLimit,
	errors,
	limit,
	clientErrors,
}: {
	overLimit: boolean;
	errors: UserImportLineError[];
	limit: number;
	clientErrors: { name: string; message: string }[];
}) => {
	return (
		<>
			{overLimit && (
				<Alert
					severity='error'
					css={`
						margin-top: 0.5rem;
					`}
				>
					<AlertTitle>File Exceeds {limit} Users</AlertTitle>
				</Alert>
			)}
			{errors.length > 0 && (
				<Card raised>
					<CardContent>
						{errors.slice(0, 3).map((error) => {
							return (
								<Alert
									key={error.line}
									severity='error'
									css={`
										margin-top: 0.5rem;
									`}
								>
									<AlertTitle>{error.line}</AlertTitle>
									<div>
										{Object.entries(error.errors).map((displayableError) => {
											return (
												<div key={`${displayableError[0]} - ${displayableError[1]}`}>
													{displayableError[1]}
												</div>
											);
										})}
									</div>
								</Alert>
							);
						})}
						{errors.length > 3 && (
							<div
								css={`
									display: flex;
									justify-content: right;
									margin-top: 0.5rem;
								`}
							>
								...
							</div>
						)}
					</CardContent>
				</Card>
			)}
			{clientErrors.length > 0 && (
				<Card raised>
					<CardContent>
						{clientErrors.slice(0, 3).map((error) => {
							return (
								<Alert
									key={error.message}
									severity='error'
									css={`
										margin-top: 0.5rem;
									`}
								>
									<AlertTitle>{error.name}</AlertTitle>
									<div>{error.message}</div>
								</Alert>
							);
						})}
						{clientErrors.length > 3 && (
							<div
								css={`
									display: flex;
									justify-content: right;
									margin-top: 0.5rem;
								`}
							>
								...
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</>
	);
};

export default ImportUserErrors;
