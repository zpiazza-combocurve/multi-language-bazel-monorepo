const getDeleteHeaders = (total: number): Record<string, string> => {
	return {
		'X-Delete-Count': total.toString(),
	};
};

export { getDeleteHeaders };
