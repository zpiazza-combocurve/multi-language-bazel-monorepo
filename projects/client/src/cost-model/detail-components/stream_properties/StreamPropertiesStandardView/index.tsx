import EconModel from '@/cost-model/detail-components/EconModel';
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as templateFields } from '@/inpt-shared/display-templates/cost-model-dialog/stream_properties.json';

import { BtuContent } from './BtuContent';
import { LossFlare } from './LossFlare';
import { Shrinkage } from './Shrinkage';
import { Yields } from './Yields';

const TABLE_KEYS = ['dates_setting_sheet', 'cut_off_sheet'];

export default function StreamPropertiesStandardView(props) {
	return (
		<EconModel
			{...props}
			header='Stream Properties'
			assumptionKey={AssumptionKey.streamProperties}
			assumptionName='Stream Properties'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='stream-properties'
			initialOmitSection={{ compositional_economics: true }}
		>
			{({
				options: { yields, shrinkage, loss_flare, btu_content },
				fields,
				handleOptionChange,
				selected,
				onSelect,
			}) => (
				<>
					{yields && (
						<Yields
							onSelect={onSelect}
							selected={selected}
							yields={yields}
							fields={fields.yields}
							setYields={handleOptionChange}
						/>
					)}
					{shrinkage && (
						<Shrinkage
							onSelect={onSelect}
							selected={selected}
							shrinkage={shrinkage}
							fields={fields.shrinkage}
							setShrinkage={handleOptionChange}
						/>
					)}
					{loss_flare && (
						<LossFlare
							onSelect={onSelect}
							selected={selected}
							loss_flare={loss_flare}
							fields={fields.loss_flare}
							setLossFlare={handleOptionChange}
						/>
					)}
					{btu_content && (
						<BtuContent
							onSelect={onSelect}
							selected={selected}
							btu_content={btu_content}
							fields={fields.btu_content}
							setBtuContent={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
