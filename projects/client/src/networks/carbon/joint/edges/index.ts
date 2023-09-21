import { DevelopmentEdge } from './DevelopmentEdge';
import { InputEdge } from './InputEdge';
import { LinkEdge } from './LinkEdge';
import { OutputEdge } from './OutputEdge';
import { StandardEdge } from './StandardEdge';

export type JointEdge = StandardEdge | DevelopmentEdge | LinkEdge;
export type AnyJointEdge = StandardEdge | InputEdge | OutputEdge | DevelopmentEdge | LinkEdge;

export { InputEdge, OutputEdge, StandardEdge, DevelopmentEdge, LinkEdge };
