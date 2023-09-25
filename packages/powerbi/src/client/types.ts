export interface EmbedToken {
	/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token#embedtoken */
	expiration: string; // The date and time (UTC) of token expiration
	token: string; // The embed token
	tokenId: string; // The unique token ID. Through audit logs, the token ID can be used to correlate operations that use the token with the generate operation.
}

export interface Report {
	/** Docs: https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group#report */
	embedUrl: string; // The embed URL of the report
}

export type RefreshExtendedStatus =
	| 'Unknown'
	| 'NotStarted'
	| 'InProgress'
	| 'Completed'
	| 'TimedOut'
	| 'Failed'
	| 'Disabled'
	| 'Cancelled';

export interface DatasetRefreshDetail {
	/**
	 * Docs: https://learn.microsoft.com/en-us/rest/api/power-bi/datasets/get-refresh-execution-details-in-group
	 *
	 * For refresh history items see the `Refresh` type
	 */
	commitMode: 'PartialBatch' | 'Transactional'; // Determines if objects will be committed in batches or only when complete
	endTime?: string; // The end date and time of the refresh (may be empty if a refresh is in progress)
	extendedStatus: RefreshExtendedStatus;
	messages: Array<{ message: string; type: 'Error' | 'Warning' }>;
	startTime: string; // The start date and time of the refresh
	type: 'Automatic' | 'Calculate' | 'ClearValues' | 'DataOnly' | 'Defragment' | 'Full'; // The type of processing to perform
}

type RefreshType =
	| 'OnDemand' // The refresh was triggered interactively through the Power BI portal
	| 'OnDemandTraining' // The refresh was triggered interactively through the Power BI portal with automatic aggregations training
	| 'Scheduled' // The refresh was triggered by a dataset refresh schedule setting
	| 'ViaApi' // The refresh was triggered by an API call
	| 'ViaEnhancedApi' // The refresh was triggered by an enhanced refresh REST API call
	| 'ViaXmlaEndpoint'; // The refresh was triggered through Power BI public XMLA endpoint

export type RefreshStatus =
	| 'Unknown' // if the completion state is unknown or a refresh is in progress.
	| 'Completed' // for a successfully completed refresh.
	| 'Failed' // for an unsuccessful refresh (`serviceExceptionJson` will contain the error code).
	| 'Disabled'; // if the refresh is disabled by a selective refresh.

export interface Refresh {
	/* For enhanced refresh details, see the `DatasetRefreshDetail` type */
	endTime: string; // The end date and time of the refresh (may be empty if a refresh is in progress)
	refreshType: RefreshType; // The type of refresh request
	requestId: string; // The identifier of the refresh request. Provide this identifier in all service requests.
	serviceExceptionJson: string; // Failure error code in JSON format (empty if no error)
	startTime: string; // The start date and time of the refresh
	status: RefreshStatus; // See `RefreshStatus` enum
}

export interface PowerBIDatasetParameterInput {
	name: string;
	newValue: string;
}

export interface PowerBIDatasetDetails {}

export interface PowerBIImportDetails {}

export interface PowerBIDatasourceDetails {}

export interface PowerBIIdentity {
	username: string;
	roles: string[];
	datasets: string[];
}

export interface ResponseMeta {
	requestId: string | null;
}
