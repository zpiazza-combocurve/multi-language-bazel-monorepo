/* eslint-disable react/no-did-update-set-state */
import { faCircle, faDotCircle, faTimesCircle } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash-es';
import { Component } from 'react';

import {
	IconButton as BaseIconButton,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from '@/components/v2';

// add base props
const IconButton = ({ children, ...rest }) => (
	<BaseIconButton size='small' color='purple' {...rest}>
		{children}
	</BaseIconButton>
);

const btwnIcons = [faDotCircle, faCircle];

class DiagThresholdDialog extends Component {
	constructor(props) {
		super(props);
		this.state = { threshold: {}, globalBetween: false };
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	componentDidMount() {}

	componentDidUpdate(prevProps) {
		const { visible, threshold } = this.props;
		const visibilityUpdate = visible !== prevProps.visible;

		if (visibilityUpdate) {
			this.setState({ threshold });
		}
	}

	cancel = () => {
		const { reject } = this.props;
		reject('Cancel threshold change');
	};

	setThresholdField = (key, idx, val) => {
		const { threshold } = this.state;
		threshold[key].values[idx] = val;
		this.setState({ threshold });
	};

	resetThreshField = (key) => {
		const { threshold } = this.state;
		threshold[key].values[0] = '';
		threshold[key].values[1] = '';
		threshold[key].between = false;
		this.setState({ threshold });
	};

	toggleThresholdBetween = (key) => {
		const { threshold } = this.state;
		threshold[key].between = !threshold[key].between;
		this.setState({ threshold });
	};

	setThresholdAll = (val) => {
		const { threshold } = this.state;
		Object.keys(threshold).forEach((key) => {
			threshold[key].between = val;
		});

		this.setState({ threshold });
	};

	saveThreshold = () => {
		const { threshold } = this.state;
		const { resolve } = this.props;
		resolve(threshold);
	};

	render() {
		const { threshold, globalBetween } = this.state;
		const { visible, diagLabels } = this.props;

		const actions = [];
		actions.push(
			// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
			<Button color='warning' onClick={this.cancel}>
				Cancel
			</Button>
		);
		actions.push(
			// eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later
			<Button color='primary' onClick={this.saveThreshold}>
				Apply
			</Button>
		);

		return (
			<Dialog fullWidth maxWidth='md' open={visible}>
				<DialogTitle>Adjust Thresholds</DialogTitle>

				<DialogContent>
					<section
						css={`
							display: flex;
							justify-content: space-around;
							padding-bottom: 1rem;
						`}
					>
						<span>
							<span>Above and Below &nbsp;&mdash;</span>

							<IconButton
								onClick={() => {
									this.setThresholdAll(false);
									this.setState({ globalBetween: false });
								}}
							>
								{globalBetween ? btwnIcons[1] : btwnIcons[0]}
							</IconButton>
						</span>

						<span>
							<span>In Between (Min and Max) &nbsp;&mdash;</span>

							<IconButton
								onClick={() => {
									this.setThresholdAll(true);
									this.setState({ globalBetween: true });
								}}
							>
								{globalBetween ? btwnIcons[0] : btwnIcons[1]}
							</IconButton>
						</span>
					</section>

					<section
						css={`
							display: flex;
							flex-wrap: wrap;
							gap: 2rem 1.5rem;
							& > * {
								flex: 1 1 100%;
								max-width: calc(33.3% - 1rem);
							}
						`}
					>
						{_.map(threshold, (keyValue, key) => (
							<div key={key}>
								<div
									css={`
										align-items: center;
										display: flex;
										justify-content: space-between;
									`}
								>
									<span>{diagLabels[key]}</span>
									<span>
										{(!!keyValue.values[0].length ||
											!!keyValue.values[1].length ||
											keyValue.between) && (
											<IconButton color='warning' onClick={() => this.resetThreshField(key)}>
												{faTimesCircle}
											</IconButton>
										)}

										<IconButton onClick={() => this.toggleThresholdBetween(key)}>
											{btwnIcons[Number(keyValue.between)]}
										</IconButton>
									</span>
								</div>

								<div
									css={`
										column-gap: 0.5rem;
										display: flex;
										width: 100%;
									`}
								>
									<TextField
										id={`${key}-0`}
										type='number'
										value={keyValue.values[0]}
										onChange={(ev) => this.setThresholdField(key, 0, ev.target.value)}
										placeholder={keyValue.between ? 'Min' : 'Below'}
									/>

									<TextField
										id={`${key}-1`}
										type='number'
										value={keyValue.values[1]}
										onChange={(ev) => this.setThresholdField(key, 1, ev.target.value)}
										placeholder={keyValue.between ? 'Max' : 'Above'}
									/>
								</div>
							</div>
						))}
					</section>
				</DialogContent>

				<DialogActions>
					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button onClick={this.cancel}>Cancel</Button>

					{/* eslint-disable-next-line react/jsx-handler-names -- TODO eslint fix later */}
					<Button color='secondary' onClick={this.saveThreshold} variant='contained'>
						Apply
					</Button>
				</DialogActions>
			</Dialog>
		);
	}
}

export default DiagThresholdDialog;
