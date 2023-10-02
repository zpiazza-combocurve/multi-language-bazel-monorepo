import { ValidationError } from '@src/helpers/validation';

const mongoKeys: string[] = [
	'reserves_category',
	'ownership_reversion',
	'forecast',
	'dates',
	'capex',
	'pricing',
	'differentials',
	'stream_properties',
	'expenses',
	'production_taxes',
	'production_vs_fit',
	'risking',
	'emission',
	'depreciation',
	'escalation',
	'emission',
	'general_options',
];

const apiInputMap: Record<string, string> = {
	actualforecast: 'production_vs_fit',
	actualorforecast: 'production_vs_fit',
	reservescategory: 'reserves_category',
	ownershipreversion: 'ownership_reversion',
	productiontaxes: 'production_taxes',
	streamproperties: 'stream_properties',
	generaloptions: 'general_options',
};

const apiKey: Record<string, string> = {
	production_vs_fit: 'actualOrForecast',
	stream_properties: 'streamProperties',
	production_taxes: 'productionTaxes',
	ownership_reversion: 'ownershipReversion',
	general_options: 'generalOptions',
	reserves_category: 'reservesCategory',
};

export class EconName {
	public readonly mongoKey: string;

	get apiKey(): string {
		return apiKey[this.mongoKey] || this.mongoKey;
	}

	get name(): string {
		return this.apiKey.charAt(0).toUpperCase() + this.apiKey.slice(1);
	}

	constructor(inputName: string) {
		this.mongoKey = this.getMongoKey(this.sanitizeInput(inputName));
	}

	static apiKeyFromMongo(mongoKey: string): string | undefined {
		return apiKey[mongoKey] ?? (mongoKeys.includes(mongoKey) ? mongoKey : undefined);
	}

	private sanitizeInput(name: string): string {
		return name.toLowerCase().replace('-', '_').replace(' ', '_');
	}

	private getMongoKey(inputName: string): string {
		if (mongoKeys.includes(inputName)) {
			return inputName;
		}

		if (inputName in apiInputMap) {
			return apiInputMap[inputName];
		}

		throw new ValidationError(`Invalid econ name: ${inputName}`, undefined, 'InvalidEconName');
	}
}
