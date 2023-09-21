import { Component } from 'react';
import { List, ListItemControl } from 'react-md';

import { Checkbox } from '@/components';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { NumberRangeField } from '@/helpers/inputFields';
import { fields } from '@/inpt-shared/display-templates/cost-model-dialog/ownership_reversion.json';

const {
	original_ownership: {
		subItems: { lease_net_revenue_interest, net_revenue_interest },
	},
	working_interest,
} = fields.ownership.initial_ownership.subItems;

const ownershipTemplate = { lease_net_revenue_interest, net_revenue_interest, working_interest };

const ownershipKeys = ['working_interest', 'net_revenue_interest', 'lease_net_revenue_interest'];

const getOwnershipDefault = () => {
	const output = {};
	ownershipKeys.forEach((key) => {
		output[key] = [0, 100];
	});

	return output;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export class FilterByOwnershipDialog extends Component<any, any> {
	constructor(props) {
		super(props);

		this.state = {
			errSet: new Set(),
			unassigned: false,
			...getOwnershipDefault(),
		};
	}

	cancel = () => {
		const { resolve } = this.props;
		this.setState({ ...getOwnershipDefault(), errSet: new Set() }, () => resolve(null));
	};

	apply = async () => {
		const { unassigned } = this.state;
		const { resolve } = this.props;
		const _state = this.state;

		const body = { getUnassigned: unassigned };

		if (!unassigned) {
			ownershipKeys.forEach((oKey) => {
				body[oKey] = _state[oKey];
			});
		}

		this.setState({ ...getOwnershipDefault() }, () => resolve(body));
	};

	handleError = (err, name) => {
		const { errSet } = this.state;
		if (err) {
			errSet.add(name);
		} else {
			errSet.delete(name);
		}

		this.setState({ errSet });
	};

	render() {
		const { errSet, unassigned } = this.state;
		const { unassignedCount, visible, allAssignmentsCount } = this.props;

		return (
			<Dialog
				maxWidth='md'
				id='scenario-ownership-filter-dialog'
				aria-labelledby='scenario-ownership-filter-dialog'
				// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
				onClose={this.cancel}
				open={visible}
			>
				<DialogTitle>Filter Ownership & Reversion</DialogTitle>
				<DialogContent className='scenario-ownership-filter-dialog-content'>
					<div
						id='ownership-options-container'
						css={`
							padding: 0 1rem;
						`}
					>
						{ownershipKeys.map((oKey) => {
							const curOwn = ownershipTemplate[oKey];
							const _state = this.state;

							return (
								<div className='input-var' key={oKey}>
									<span className='input-label md-text'>{curOwn.fieldName} (%):</span>
									<NumberRangeField
										dif={0}
										disabled={unassigned}
										max={curOwn.max}
										min={curOwn.min}
										names={[`${oKey}.0`, `${oKey}.1`]}
										onError={this.handleError}
										required={curOwn.required}
										setVal={(val, name) => {
											const curVal = _state[oKey];
											const idx = name.split('.')[1];
											curVal[idx] = val;
											this.setState({ [oKey]: curVal });
										}}
										values={[_state[oKey][0], _state[oKey][1]]}
									/>
								</div>
							);
						})}
						<List>
							<ListItemControl
								className='on-hover-paper-1 on-hover-background-primary-opaque remove-md-list-bg-hover'
								primaryAction={
									<Checkbox
										id='unassigned-ownership-reversion-checkbox'
										name='unassigned-ownership-reversion-checkbox'
										onChange={(checked) => this.setState({ unassigned: checked })}
										value={unassigned}
									/>
								}
								primaryText={<span className='list-text'>Unassigned Wells</span>}
								secondaryText={
									<div className='list-secondary-text'>
										<span>{`${((unassignedCount / allAssignmentsCount) * 100).toFixed(
											1
										)} | ${unassignedCount} ${unassignedCount === 1 ? 'Well' : 'Wells'}`}</span>
									</div>
								}
							/>
						</List>
					</div>
				</DialogContent>
				<DialogActions>
					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button onClick={this.cancel}>Cancel</Button>
					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button color='primary' disabled={!!errSet.size} onClick={this.apply}>
						Apply
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default FilterByOwnershipDialog;
