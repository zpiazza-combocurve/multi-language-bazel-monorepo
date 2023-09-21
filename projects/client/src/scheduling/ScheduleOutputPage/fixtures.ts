export const getConstructionLast = {
	scheduleSettings: {
		activitySteps: [],
		resources: [],
	},
	run: {
		status: 'succeeded',
		user: {
			_id: '62686a77383b530012a0f42e',
			firstName: 'Tulio',
			lastName: 'Assis',
		},
		start: '2023-03-08T19:46:02.813Z',
		finish: '2023-03-08T19:46:03.786Z',
	},
	_id: '6408bbca75403ea4c8b98f99',
	schedule: {
		_id: '63f8e59d25e20e00122dcb07',
		name: 'Schedule',
	},
	method: 'auto',
	project: '63c1b40eb322695e549724a8',
	wellOutputIds: ['6408bbcb62009419ee11a83a', '6408bbcb62009419ee11a83b', '6408bbcb62009419ee11a83c'],
};

export const postWellOutputs = {
	wells: [
		{
			_id: '6408bbcb62009419ee11a83a',
			output: {
				events: [
					{
						activityStepIdx: 0,
						activityStepName: 'Pad Preparation',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: 44941,
							end: 44945,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 1,
						activityStepName: 'Spud',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: null,
							end: null,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 2,
						activityStepName: 'Drilling',
						resourceIdx: 0,
						resourceName: 'Primary Rig 1',
						mob: {
							start: 44946,
							end: 44946,
						},
						work: {
							start: 44947,
							end: 44961,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 3,
						activityStepName: 'Completion',
						resourceIdx: 1,
						resourceName: 'Completion Crew 1',
						mob: {
							start: 44962,
							end: 44962,
						},
						work: {
							start: 44963,
							end: 44977,
						},
						demob: {
							start: null,
							end: null,
						},
					},
				],
				FPD: 44992,
			},
			well: {
				_id: '5e272d3bb78910dd2a1be8d6',
				chosenID: '42355327580000',
				api14: '42355327580000',
				county: 'NUECES (TX)',
				inptID: 'INPT.b8DZUnpKKE',
				state: 'TX',
				status: 'ACTIVE',
				well_name: 'RIVERS, A',
				well_number: '19 F',
				scheduling_status: 'not_started',
				_order: 1,
			},
		},
		{
			_id: '6408bbcb62009419ee11a83b',
			output: {
				events: [
					{
						activityStepIdx: 0,
						activityStepName: 'Pad Preparation',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: 44941,
							end: 44945,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 1,
						activityStepName: 'Spud',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: null,
							end: null,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 2,
						activityStepName: 'Drilling',
						resourceIdx: 0,
						resourceName: 'Primary Rig 1',
						mob: {
							start: 44962,
							end: 44962,
						},
						work: {
							start: 44963,
							end: 44977,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 3,
						activityStepName: 'Completion',
						resourceIdx: 2,
						resourceName: 'Completion Crew 2',
						mob: {
							start: 44978,
							end: 44978,
						},
						work: {
							start: 44979,
							end: 44993,
						},
						demob: {
							start: 44994,
							end: 44994,
						},
					},
				],
				FPD: 45009,
			},
			well: {
				_id: '5e272d3bb78910dd2a1be8f4',
				chosenID: '42339309740000',
				api14: '42339309740000',
				county: 'MONTGOMERY (TX)',
				inptID: 'INPT.rduyWdlxJh',
				state: 'TX',
				status: 'ACTIVE',
				well_name: 'RHODES, W. S.',
				well_number: '19',
				scheduling_status: 'not_started',
				_order: 2,
			},
		},
		{
			_id: '6408bbcb62009419ee11a83c',
			output: {
				events: [
					{
						activityStepIdx: 0,
						activityStepName: 'Pad Preparation',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: 44946,
							end: 44950,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 1,
						activityStepName: 'Spud',
						resourceIdx: null,
						resourceName: null,
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: null,
							end: null,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 2,
						activityStepName: 'Drilling',
						resourceIdx: 3,
						resourceName: 'Primary Rig 2',
						mob: {
							start: null,
							end: null,
						},
						work: {
							start: 44963,
							end: 44977,
						},
						demob: {
							start: null,
							end: null,
						},
					},
					{
						activityStepIdx: 3,
						activityStepName: 'Completion',
						resourceIdx: 4,
						resourceName: 'Completion Crew 3',
						mob: {
							start: 44978,
							end: 44978,
						},
						work: {
							start: 44979,
							end: 44993,
						},
						demob: {
							start: 44994,
							end: 44994,
						},
					},
				],
				FPD: 45009,
			},
			well: {
				_id: '5e272d52b78910dd2a1c6ed2',
				chosenID: '42273312080000',
				api14: '42273312080000',
				county: 'KLEBERG (TX)',
				inptID: 'INPT.snsAHZKt0b',
				state: 'TX',
				status: 'ACTIVE',
				well_name: 'KING RANCH STRATTON',
				well_number: 'T 41 F',
				scheduling_status: 'not_started',
				_order: 3,
			},
		},
	],
};
