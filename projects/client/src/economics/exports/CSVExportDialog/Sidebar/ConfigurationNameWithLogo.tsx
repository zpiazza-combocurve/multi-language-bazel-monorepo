import { CSVExportTemplate } from '../types';
import CCLogo from './ConfigurationNameWithLogo/CCLogo';
import { isSuggestedTemplate } from './helpers';

export function ConfigurationNameWithLogo(template: CSVExportTemplate) {
	const { name } = template;
	if (isSuggestedTemplate(template)) {
		return (
			<>
				<CCLogo />
				<span css='margin-left: 0.25rem;'>{name}</span>
			</>
		);
	}
	return name;
}
