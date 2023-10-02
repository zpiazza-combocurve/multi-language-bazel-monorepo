export const postApi = jest.fn();
export const setHeaders = jest.fn();
export const RequestModule = jest.fn(() => {
	return {
		setHeaders,
		postApi,
	};
});
