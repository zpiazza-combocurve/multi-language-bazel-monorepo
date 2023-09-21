export const convertDateColumns = (tasks, wellHeadersTypes) =>
	tasks.map((task) => {
		return {
			...task,
			well: Object.fromEntries(
				Object.entries(task.well).map(([key, value]) => {
					let newValue = value;
					if (wellHeadersTypes[key]?.type === 'date') {
						newValue = new Date(value);
					}
					return [key, newValue];
				})
			),
		};
	});
