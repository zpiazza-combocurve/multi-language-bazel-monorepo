import { faCarCrash } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Component, ComponentType, forwardRef } from 'react';

import { Button, Card, CardContent } from '@/components/v2';
import { theme } from '@/helpers/styled';

import { addHOCName } from './shared';

/**
 * Error boundaries catch errors:
 *
 * - During rendering
 * - In lifecycle methods
 * - In constructors of the whole tree below them
 *
 * Error boundaries do NOT catch errors:
 *
 * - In event handlers
 * - During asynchronous execution (e.g. setTimeout or requestAnimationFrame callbacks)
 * - On server side rendering
 * - Thrown in the error boundary itself (rather than its children)
 *
 * IDEA: Report errors to logging service once we set it up IDEA: Maybe add button to let the user give error details,
 * or to create a feedback
 */
class ErrorBoundary extends Component {
	static getDerivedStateFromError(error) {
		return { error };
	}

	state = { error: null };

	handleReload = () => {
		this.setState({ error: null });
	};

	render() {
		const { children } = this.props;
		const { error } = this.state;

		if (error) {
			return (
				<Card css={{ margin: '1rem auto auto', maxWidth: '920px' }}>
					<CardContent>
						<div
							css={`
								display: flex;
								flex-direction: column;
								align-items: center;
								padding: 1rem;
								gap: 1rem;
							`}
						>
							<FontAwesomeIcon css={{ fontSize: '5rem', color: theme.warningColor }} icon={faCarCrash} />
							<div css='text-align: center;'>
								<div css='font-size: 2rem;'>Something went wrong</div>
								<div css='font-size: 1.25rem; margin-top: 1rem;'>
									We received a report for this error and we&#39;ll work on it soon
								</div>
							</div>
							<Button variant='outlined' onClick={this.handleReload}>
								Reload
							</Button>
						</div>
					</CardContent>
					{/* A feedback button here will be nice to have */}
					{/* Also, some logging plattforms like Sentry provide a widget to allow the user submit error details */}
					{/* <CardActions centered>
						<Button flat primary>
							Feedback
						</Button>
					</CardActions> */}
				</Card>
			);
		}

		// needs to be wrapped in fragment just in case // TODO check if it is really needed
		// eslint-disable-next-line react/jsx-no-useless-fragment
		return <>{children}</>;
	}
}

// previous name was `errorBoundaryWrapper` but a more "standard" name solution is to prepend HOCs with `with`
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function withErrorBoundary<C extends ComponentType<any>>(OriginalComponent: C): C {
	return addHOCName(
		forwardRef((props, ref) => (
			<ErrorBoundary>
				{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later */}
				{/* @ts-expect-error */}
				<OriginalComponent ref={ref} {...props} />
			</ErrorBoundary>
		)),
		'withErrorBoundary',
		OriginalComponent
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) as any;
}

export default ErrorBoundary;
