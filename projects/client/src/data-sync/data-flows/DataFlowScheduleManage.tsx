import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@material-ui/core';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Cron } from 'react-js-cron-mui';
import { useMutation } from 'react-query';

import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Icon,
	RHFCheckboxField,
	RHFTextField,
	ReactDatePicker,
} from '@/components/v2';
import SelectField from '@/components/v2/misc/SelectField';
import { confirmationAlert } from '@/helpers/alerts';
import { DialogProps } from '@/helpers/dialog';
import { putApi } from '@/helpers/routing';
import { Item } from '@/module-list/types';

import { MainButton } from '../components/MainButton';
import { TextButton } from '../components/TextButton';
import styles from './manage.module.scss';

type DataFlowItem = Assign<Item, Inpt.DataFlow>;
type DataFlowScheduleItem = Assign<Item, Inpt.DataFlowSchedule>;

const ScheduleTypes = ['oneTime', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;
type ScheduleType = (typeof ScheduleTypes)[number];

export interface DataFlowScheduleManageModalProps extends DialogProps {
	className?: string;
	dataFlow: DataFlowItem;
	refetch: () => void;
}

function DataFlowScheduleManageModal(props: DataFlowScheduleManageModalProps) {
	const { visible, onHide, dataFlow, refetch } = props;
	const dataFlowSchedule = dataFlow?.dataFlowSchedule;
	const initialScheduleType = dataFlowSchedule ? (dataFlowSchedule.schedulePlan ? 'custom' : 'oneTime') : 'oneTime';
	const initialStartAtDateTime = dataFlowSchedule?.nextRunStartsAt;

	const [scheduleType, setScheduleType] = useState<ScheduleType>(initialScheduleType);
	const [startAtDate, setStartAtDate] = useState<Date>(initialStartAtDateTime);

	const defaultValues = useMemo(
		() => ({
			priority: 100,
			schedulePlan: '* * * * *',
			...(dataFlowSchedule ? dataFlowSchedule : {}),
		}),
		[dataFlowSchedule]
	);

	const {
		control,
		handleSubmit,
		setValue,
		formState: { isValid },
	} = useForm({
		defaultValues,
		mode: 'all',
	});

	const mutation = useMutation(
		async (values: Partial<DataFlowScheduleItem>) => {
			const body =
				scheduleType === 'oneTime'
					? {
							priority: values.priority,
							nextRunStartsAt: startAtDate,
					  }
					: {
							priority: values.priority,
							schedulePlan: values.schedulePlan,
							runImmediately: values.runImmediately,
					  };
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			return putApi(`/data-sync/data-flows/${dataFlow.id}/schedule`, body) as Promise<any>;
		},
		{
			onSuccess: () => {
				confirmationAlert('Data Flow schedule updated');
				onHide();
				refetch();
			},
		}
	);

	const customSetValue = (value) => {
		setValue('schedulePlan', value, { shouldDirty: true });
	};

	const watchedCronValue = useWatch({
		control,
		name: 'schedulePlan',
	});

	const setSchedulePlan = (scheduleType: ScheduleType) => {
		const date = new Date();
		const weekDay = date.getDay();
		const day = date.getDay();
		const month = date.getMonth() + 1;

		switch (scheduleType) {
			case 'daily':
				customSetValue('0 0 * * *');
				break;
			case 'weekly':
				customSetValue(`0 0 * * ${weekDay}`);
				break;
			case 'monthly':
				customSetValue(`0 0 ${month} * *`);
				break;
			case 'yearly':
				customSetValue(`0 0 ${day} ${month} *`);
				break;
			case 'custom':
				customSetValue('* * * * *');
				break;
		}
	};

	const handleRecurrencyChange = (scheduleType: ScheduleType) => {
		setScheduleType(scheduleType);
		setSchedulePlan(scheduleType);
	};

	const handleCreate = handleSubmit((values: Partial<DataFlowScheduleItem>) => mutation.mutate(values));

	const defaultSchedule = defaultValues.schedulePlan;
	const currentTimezone = format(new Date(), 'zzzz');

	const recurrencyDropdownItems = [
		{
			key: 'oneTime',
			value: 'oneTime',
			label: 'Does not repeat',
		},
		{
			key: 'daily',
			value: 'daily',
			label: 'Daily',
		},
		{
			key: 'weekly',
			value: 'weekly',
			label: 'Weekly',
		},
		{
			key: 'monthly',
			value: 'monthly',
			label: 'Monthly',
		},
		{
			key: 'yearly',
			value: 'yearly',
			label: 'Yearly',
		},
		{
			key: 'custom',
			value: 'custom',
			label: 'Custom',
		},
	];
	return (
		<Dialog fullWidth maxWidth='sm' open={visible} onClose={onHide}>
			<DialogTitle>Manage Schedule</DialogTitle>
			<DialogContent>
				<Box>
					<Typography>Current timezone: {currentTimezone}</Typography>
				</Box>
				<Box>
					<Box sx={{ width: 300, margin: '10px 0px' }}>
						<RHFTextField
							fullWidth
							name='priority'
							label='Priority'
							type='number'
							control={control}
							required
							rules={{ required: true }}
						/>
					</Box>
				</Box>
				<Box sx={{ width: 300, margin: '10px 0px' }}>
					<SelectField
						label='Recurrency'
						menuItems={recurrencyDropdownItems}
						fullWidth
						value={scheduleType}
						onChange={(ev) => handleRecurrencyChange(ev.target.value as ScheduleType)}
					/>
				</Box>
				<Box style={{ display: scheduleType === 'oneTime' ? 'initial' : 'none' }}>
					<Box sx={{ width: 300, margin: '10px 0px' }}>
						<ReactDatePicker
							showTimeSelect
							fullWidth
							name='nextRunStartsAt'
							label='Start date'
							dateFormat='MM/dd/yyyy hh:mm aa'
							onChange={(value) => setStartAtDate(value as Date)}
							selected={startAtDate}
							required
						/>
					</Box>
				</Box>
				<Box style={{ display: scheduleType !== 'oneTime' ? 'initial' : 'none' }}>
					<Box sx={{ margin: '10px 0' }}>
						<Cron
							value={watchedCronValue ?? defaultSchedule}
							setValue={customSetValue}
							className={styles.cron}
							humanizeLabels
							leadingZero
						/>
					</Box>
					<Box sx={{ width: 300, margin: '10px 0px' }}>
						<RHFCheckboxField name='runImmediately' label='Run immediately' control={control} rules={{}} />
					</Box>
					<Box
						css={`
							.MuiPaper-elevation1 {
								box-shadow: none;
							}
							.MuiAccordionSummary-root {
								padding: 0;
							}
							.MuiAccordionDetails-root {
								padding-left: 0;
								padding-right: 0;
							}
							.MuiAccordionSummary-expandIcon {
								order: -1;
							}
							.MuiIconButton-edgeEnd {
								margin-left: -12px;
								margin-right: 0;
							}
						`}
					>
						<Accordion>
							<AccordionSummary expandIcon={<Icon>{faChevronDown}</Icon>}>
								<Typography>Advanced</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Box sx={{ width: 300 }}>
									<RHFTextField
										fullWidth
										name='schedulePlan'
										label='Schedule'
										control={control}
										rules={{}}
									/>
								</Box>
							</AccordionDetails>
						</Accordion>
					</Box>
				</Box>
			</DialogContent>

			<DialogActions>
				<TextButton onClick={onHide}>Cancel</TextButton>

				<MainButton onClick={handleCreate} disabled={!isValid || mutation.isLoading}>
					Save
				</MainButton>
			</DialogActions>
		</Dialog>
	);
}

export default DataFlowScheduleManageModal;
