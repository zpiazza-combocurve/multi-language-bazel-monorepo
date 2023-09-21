interface User {
	firstName: string;
	lastName: string;
}

interface Project {
	_id: string;
	name: string;
}

export interface ProjectForecastItem {
	_id: string;
	forecasted: boolean;
	type: string;
	wells: string[];
	name: string;
	project: Project;
	user: User;
	createdAt: string;
	updatedAt: string;
	wellCount: number;
	wellsCollectionsCount: number;
}
