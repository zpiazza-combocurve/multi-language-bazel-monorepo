import { createContext } from 'react';

import { Selection } from '@/components/hooks/useSelection';

import { ModuleListBag } from '../ModuleList/useModuleList';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const FiltersContext = createContext<ModuleListBag<any, any> & { selection?: Selection }>(undefined as any);
