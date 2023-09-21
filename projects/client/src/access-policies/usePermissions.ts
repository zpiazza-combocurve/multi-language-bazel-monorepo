import { Ability } from '@casl/ability';
import { useAbility } from '@casl/react';

import { ACTIONS, AbilityContext, PERMISSIONS_TOOLTIP_MESSAGE, subject } from '@/access-policies/Can';
import { SUBJECTS, SubjectType } from '@/inpt-shared/access-policies/shared';

const INVALID_PROJECT_ID = '___INVALID_PROJECT_ID___' as Inpt.ObjectId;

// projectId needs to be either null (company level) or a valid project id
// if it's undefined the default INVALID_PROJECT_ID value would cause all the actions to return false
// if it's anything other than null or a valid project id this would throw an error
export const buildPermissions = (
	ability: Ability,
	subjectType: (typeof SUBJECTS)[keyof typeof SUBJECTS],
	projectId: undefined | null | string | Inpt.ObjectId = INVALID_PROJECT_ID,
	projectProperty = 'project'
) => {
	if (projectId !== null && projectId.toString().length !== 24) {
		throw new Error(`Invalid projectId: ${projectId}`);
	}

	const customSubject = projectId === null ? subjectType : subject(subjectType, { [projectProperty]: projectId });

	const canCreate = ability.can(ACTIONS.Create, customSubject);
	const canDelete = ability.can(ACTIONS.Delete, customSubject);
	const canUpdate = ability.can(ACTIONS.Update, customSubject);
	const canView = ability.can(ACTIONS.View, customSubject);

	return {
		ability,
		canCreate,
		canDelete,
		canUpdate,
		canView,
	};
};

export { PERMISSIONS_TOOLTIP_MESSAGE, SUBJECTS };

export const usePermissions = (
	subjectType: (typeof SUBJECTS)[keyof typeof SUBJECTS],
	projectId: undefined | null | Inpt.ObjectId = INVALID_PROJECT_ID
) => {
	const ability = useAbility(AbilityContext);

	return buildPermissions(ability, subjectType, projectId);
};

/**
 * Useful for inline permission checking when iterating over list of items
 *
 * @example
 * 	const { canDelete } = usePermissionsBuilder(SUBJECTS.Assumptions);
 * 	models.map((model) => <>{canDelete(model)}</>);
 */
export const usePermissionsBuilder = (subjectType: SubjectType) => {
	const ability = useAbility(AbilityContext);

	const actions = {
		canCreate: ACTIONS.Create,
		canDelete: ACTIONS.Delete,
		canUpdate: ACTIONS.Update,
		canView: ACTIONS.View,
	};

	return {
		permissionTooltip: PERMISSIONS_TOOLTIP_MESSAGE,
		ability,
		...Object.entries(actions).reduce(
			(acc, [key, action]) => ({
				...acc,
				[key]: (item) => ability.can(action, subject(subjectType, item)),
			}),
			{} as { [k in keyof typeof actions]: (item) => ReturnType<typeof ability.can> }
		),
	};
};

export default usePermissions;
