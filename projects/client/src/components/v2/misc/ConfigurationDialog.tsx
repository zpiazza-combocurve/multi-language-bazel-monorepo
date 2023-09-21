import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, RHFTextField } from '@/components/v2';
import { withSpacedStyles } from '@/helpers/styled';
import { assert } from '@/helpers/utilities';
import { Section, SectionContent, SectionHeader } from '@/layouts/Section';

import { ConfigurationList } from './ConfigurationDialog/ConfigurationList';
import { getDefaultConfigurationName } from './ConfigurationDialog/helpers';
import { ConfigurationDialogProps } from './ConfigurationDialog/types';

/**
 * @example
 * 	import { ConfigurationDialog } from '@/components/v2/misc';
 * 	import { useDialog } from '@/helpers/dialog';
 *
 * 	const [configurationDialog, showConfigurationDialog] = useDialog(ConfigurationDialog, {
 * 		configurations,
 * 		createConfiguration,
 * 		defaultName,
 * 		deleteConfiguration,
 * 		getConfigurationName,
 * 		isDefaultConfiguration,
 * 		setDefaultConfiguration,
 * 		updateConfiguration,
 * 	});
 * 	return (
 * 		<>
 * 			{configurationDialog}
 * 			<Button onClick={showConfigurationDialog}>Show Dialog</Button>
 * 		</>
 * 	);
 */

export function ConfigurationDialog<T>(props: ConfigurationDialogProps<T>) {
	const {
		deleteConfiguration,
		getConfigurationName = getDefaultConfigurationName,
		createConfiguration,
		updateConfiguration,
		isDefaultConfiguration,
		configurations,
		defaultName,
		onHide,
		resolve,
		setDefaultConfiguration,
		visible,
	} = props;

	const { control, handleSubmit, watch, setValue } = useForm({
		defaultValues: {
			name: defaultName ?? '',
		},
	});

	const nameMap: Record<string, number> = useMemo(
		() =>
			configurations?.reduce((acc, item, index) => {
				const name = getConfigurationName(item);
				acc[name] = index;
				return acc;
			}, {}) ?? {},
		[configurations, getConfigurationName]
	);
	const inputName = watch('name')?.trim();
	const selectedIndex = nameMap[inputName ?? ''];
	const selectedConfiguration = configurations?.[selectedIndex];

	const saveConfiguration = () => {
		handleSubmit(async ({ name }) => {
			if (selectedConfiguration == null) createConfiguration(name);
			else updateConfiguration(selectedConfiguration);
		})();
	};

	const onSelect = (c, index: number) => {
		const newValue = getConfigurationName((configurations ?? [])[index]);
		assert(newValue);
		setValue('name', newValue);
	};

	return (
		<Dialog fullWidth maxWidth='sm' onClose={onHide} open={!!visible}>
			<DialogTitle>Group Configuration</DialogTitle>
			<DialogContent>
				<Section
					css={`
						${withSpacedStyles()}
						height: 50vh;
					`}
				>
					<SectionHeader
						css={`
							padding-top: 0.5rem;
							${withSpacedStyles({ horizontal: true })}
							display: flex;
							align-items: baseline;
						`}
					>
						<RHFTextField
							disabled={configurations == null}
							size='small'
							variant='outlined'
							label='Name'
							name='name'
							control={control}
						/>
						<Button
							disabled={!inputName?.length}
							variant='outlined'
							color='secondary'
							onClick={saveConfiguration}
						>
							Save
						</Button>
					</SectionHeader>

					<SectionContent>
						{configurations != null && (
							<ConfigurationList
								configurations={configurations}
								deleteConfiguration={deleteConfiguration}
								getConfigurationKey={getConfigurationName}
								getConfigurationName={getConfigurationName}
								isDefaultConfiguration={isDefaultConfiguration}
								isSelected={(c, index) => selectedIndex === index}
								onSelect={onSelect}
								setDefaultConfiguration={setDefaultConfiguration}
							/>
						)}
					</SectionContent>
				</Section>
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button
					variant='contained'
					color='secondary'
					disabled={selectedIndex == null}
					onClick={() => resolve(selectedConfiguration)}
				>
					Select
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default ConfigurationDialog;
