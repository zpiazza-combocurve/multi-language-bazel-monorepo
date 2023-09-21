import { message, schema } from './type-helpers';

// see schema function docs for examples
const { localize, polyglot, phrases } = schema({
	operations: {
		project: {
			create: {
				complete: message<{ projectName: string }>('Project "%{projectName}" created'),
			},
		},
		networkModelFacility: {
			create: {
				complete: message<{ facilityName: string }>('Facility "%{facilityName}" created'),
			},
			update: {
				complete: message<{ facilityName: string }>('Facility "%{facilityName}" updated successfully'),
			},
		},
		networkModel: {
			create: {
				complete: message<{ networkModelName: string }>('Network "%{networkModelName}" created'),
			},
			update: {
				complete: message<{ networkModelName: string }>('Network "%{networkModelName}" updated successfully'),
			},
			assignFluidModel: {
				complete: message<{ name: string }>('Fluid Model %{name} assigned'),
			},
		},
	},
	nodeModel: {
		label: 'Node Models',
		singular: 'Node Model',
		notifications: {
			updated: 'Node model updated successfully',
			created: 'Node model created successfully',
			deleted: 'Node model deleted successfully',
			renamed: 'Node model renamed successfully',
		},
	},
	network: {
		label: 'Networks',
		singular: 'Network',
		drawer: {
			label: 'Carbon Network',
		},
		dialogs: {
			create: {
				title: 'Create Network',
				confirm: 'Create',
			},
			import: {
				title: 'Import Network(s)',
			},
		},
	},
	facility: {
		label: 'Facilities',
		singular: 'Facility',
	},
	emission: {
		import: {
			noData: 'No emission data available for the selected company, basin, category, and year.',
		},
	},
	tooltips: {
		removeLeadingZeros:
			'Remove monthly and daily production data of selected wells prior to first non-zero production date',
	},
	dialogs: {
		removeLeadingZeros: {
			title: 'Remove Leading Zeros',
			text: message<{ smart_count: number }>(
				'Remove leading zeros from production data for %{smart_count} well |||| Remove leading zeros from production data for %{smart_count} wells'
			),
			confirm: 'Remove',
		},
	},
});

export { localize, polyglot, phrases };
