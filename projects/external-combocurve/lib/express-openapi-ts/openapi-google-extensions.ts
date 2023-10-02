export interface GoogleRateLimitManagement {
	metrics: Array<{
		name: string;
		displayName: string;
		valueType: 'INT64';
		metricKind: 'DELTA';
	}>;
	quota: {
		limits: Array<{
			name: string;
			metric: string;
			unit: '1/min/{project}';
			values: {
				STANDARD: number;
			};
		}>;
	};
}
