const getModelDefinitionName = (definitionRef: string): string => {
	const split = definitionRef.split('/');

	return split[split.length - 1];
};

export { getModelDefinitionName };
