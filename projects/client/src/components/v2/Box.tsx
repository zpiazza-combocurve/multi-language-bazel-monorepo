import { Box as MUBox } from '@material-ui/core';
import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const Box = MUBox as any as React.ElementType<Omit<React.ComponentPropsWithRef<typeof MUBox>, 'css'>>; // HACK for css property-typescript issue, in reality it just forwards the component without any changes

export { Box };
