import { NodeType } from '@combocurve/types/client/network-shared';

import { redirectToZoho } from '@/helpers/routing';

export const NODES_ZOHO: Record<NodeType, string> = {
	well_group: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Well_Group',
	atmosphere: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Atmosphere',
	econ_output:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Econ_Output',
	oil_tank: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Oil_Tank',
	flare: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Flare',
	liquids_unloading:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Liquids_Unloading',
	associated_gas:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Associated_Gas',
	facility:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Facility_Node',
	combustion: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Combustion',
	pneumatic_device:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Pneumatic_Devices',
	pneumatic_pump:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Pneumatic_Pumps',
	centrifugal_compressor:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Centrifugal_Compressors',
	reciprocating_compressor:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Reciprocating_Compressors',
	drilling: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Drilling',
	completion: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Completion',
	flowback: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Flowback',
	capture: 'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Capture',
	custom_calculation:
		'https://support.combocurve.com/portal/en/kb/articles/combocarbon-carbon-network-overview%23Custom_Calculation',
};

export function goNodeZohoPage(nodeType: NodeType) {
	redirectToZoho(NODES_ZOHO[nodeType]);
}
