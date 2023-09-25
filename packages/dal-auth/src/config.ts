export interface DALEnvironmentConfig {
	// The URL of the DAL server.
	dalUrl: string;

	// An optional email of a service account to use for authentication with the DAL server. Not needed when running in production
	// from GCE based environments. This is useful when running locally or from other cloud environments like Cloud Build.
	dalServiceAccount?: string | undefined;
}
