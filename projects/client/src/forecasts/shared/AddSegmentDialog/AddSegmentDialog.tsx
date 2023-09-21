import { SegmentParent } from '@combocurve/forecast/models';
import { useEffect, useState } from 'react';

import { Button, CheckboxField, Dialog, DialogTitle, Divider } from '@/components/v2';
import { SelectField } from '@/components/v2/misc';
import { generateFirstSegment, generateNextSegment } from '@/forecasts/charts/forecastChartHelper';
import { fields as segmentModels } from '@/inpt-shared/display-templates/segment-templates/seg_models.json';
import { fields as segmentParameters } from '@/inpt-shared/display-templates/segment-templates/seg_params.json';

import { FooterActions, FormContainer } from './layout';

const AddSegmentDialog = (props) => {
	const { disableDate = false, editBase, editSeries, qConversion, resolve, visible } = props;

	const [addToEnd, setAddToEnd] = useState(true);
	const [segment, setSegment] = useState({});
	const [segmentName, setSegmentName] = useState('');

	const onClose = () => {
		resolve(null);
		setSegmentName('');
	};

	const onAddSegment = () => {
		const relativeTime = editBase === 'typecurve';
		const segmentInstance = new SegmentParent(segment, relativeTime);
		resolve([
			segmentInstance.viewToCalc({
				viewSegment: segment,
				unitConvertFunc: qConversion.toCalc,
				idxDate: disableDate,
			}),
			addToEnd,
		]);
		setSegmentName('');
	};
	const loaded = Boolean(segmentModels && segmentParameters && segmentName.length);

	const modelMenuItems = segmentModels
		? Object.keys(segmentModels)
				.map((model) => {
					return {
						value: model,
						label: segmentModels[model].label,
					};
				})
				.sort((a, b) => a.label.localeCompare(b.label))
		: [];

	useEffect(() => {
		if (segmentName.length) {
			const relativeTime = editBase === 'typecurve';
			setSegment(() => {
				const generatedSegment = (addToEnd ? generateNextSegment : generateFirstSegment)({
					name: segmentName,
					series: editSeries,
					relativeTime,
				});

				const segmentInstance = new SegmentParent(generatedSegment, relativeTime);
				return segmentInstance.calcToView({ unitConvertFunc: qConversion.toView, idxDate: disableDate });
			});
		}
	}, [addToEnd, disableDate, editBase, editSeries, qConversion.toView, segmentName]);

	return (
		<Dialog fullWidth maxWidth='xs' open={visible}>
			<DialogTitle>Add Segment</DialogTitle>

			<FormContainer>
				<SelectField
					label='Model'
					menuItems={modelMenuItems}
					onChange={(ev) => setSegmentName(ev.target.value)}
					placeholder='Select Model'
					size='small'
					value={segmentName}
					variant='outlined'
				/>

				{loaded && (
					<>
						<Divider />
						{Boolean(editSeries?.length) && (
							<CheckboxField
								css='align-self: center;'
								label='Add To End?'
								onChange={(_ev, newValue) => setAddToEnd(newValue)}
								checked={addToEnd}
							/>
						)}
					</>
				)}
			</FormContainer>

			<FooterActions>
				<Button onClick={onClose}>Close</Button>
				<Button disabled={!segmentName?.length} onClick={onAddSegment} variant='contained' color='secondary'>
					Add
				</Button>
			</FooterActions>
		</Dialog>
	);
};

export default AddSegmentDialog;
