import CustomCalculationNode from './CustomCalculationNode';
import { DeviceNode } from './DeviceNode';
import { FacilityNode } from './FacilityNode';

export type AnyJointNode = DeviceNode | FacilityNode | CustomCalculationNode;

export { DeviceNode, FacilityNode, CustomCalculationNode };
