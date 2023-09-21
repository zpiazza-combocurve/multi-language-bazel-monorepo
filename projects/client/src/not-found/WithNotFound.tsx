import NotFound from './not-found';

const WithNotFound = ({ noData, children }: { noData: boolean; children?: React.ReactNode }): JSX.Element => {
	if (noData) {
		return <NotFound />;
	}

	// React Router's `element` requires us to return a React Node at all times, which is not always so with `children`
	// Hence we add a React fragment to wrap it up.
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
};

export default WithNotFound;
