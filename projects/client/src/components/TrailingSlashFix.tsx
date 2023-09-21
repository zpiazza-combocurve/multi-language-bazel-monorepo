import { Navigate, useLocation } from 'react-router-dom';

/**
 * Prevents conflicts on some URLS
 *
 * @see https://jasonwatmore.com/post/2020/03/23/react-router-remove-trailing-slash-from-urls
 */
export default function TrailingSlashFix({ children }) {
	const location = useLocation();
	const { pathname } = location;

	// Removing trailing slash
	if (location.pathname.match('/.*/$')) {
		return <Navigate to={pathname.slice(0, -1)} replace />;
	}

	return children;
}
