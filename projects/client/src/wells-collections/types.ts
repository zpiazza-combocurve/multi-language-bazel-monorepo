export type CreateWellsCollectionParams = Pick<Inpt.WellsCollection, 'well_name' | 'project'> & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	headers: Record<string, any>;
};

export type RemoveWellsCollectionParams = {
	wellsCollectionIds: Inpt.ObjectId<'wells-collection'>[];
};

export type AddWellsToWellsCollectionMutationVariables = {
	wellsCollectionId: Inpt.ObjectId<'wells-collection'>;
	wells: Inpt.ObjectId<'well'>[];
};

export type RemoveWellsFromWellsCollectionsMutationVariables = Record<
	Inpt.ObjectId<'wells-collection'>,
	Inpt.ObjectId<'well'>[]
>;

export type RemoveWellsCollectionMutationVariables = {
	wellsCollectionIds: Inpt.ObjectId<'wells-collection'>[];
};

export type MassCreateWellsCollectionParams = Pick<Inpt.WellsCollection, 'project'> & {
	headers: string[];
	name: string;
	headerAsName?: boolean;
};
