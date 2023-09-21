import { Ability } from '@casl/ability';
import { createContextualCan } from '@casl/react';
import { createContext } from 'react';

import { Action, Subject } from '@/inpt-shared/access-policies/shared';

export { subject } from '@casl/ability';

export * from '@/inpt-shared/access-policies/shared';

export const ability = new Ability<[Action, Subject]>([]);

export function updateAbility(rules) {
	ability.update(rules);
}

export const AbilityContext = createContext(ability);
export const Can = createContextualCan(AbilityContext.Consumer);
