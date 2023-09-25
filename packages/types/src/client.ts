import type { Client } from './helpers';
import type { Facility as FacilityBase } from './schemas/facility';
import type { Network as NetworkBase } from './schemas/network';
import type { NodeModel as NodeModelBase } from './schemas/node-model';
import type { Project as ProjectBase } from './schemas/project';
import type { User as UserBase } from './schemas/user';

export * as NetworkShared from './client/network-shared';

export type Project = Client<ProjectBase>;
export type Network = Client<NetworkBase>;
export type Facility = Client<FacilityBase>;
export type NodeModel = Client<NodeModelBase>;
export type User = Client<UserBase>;
