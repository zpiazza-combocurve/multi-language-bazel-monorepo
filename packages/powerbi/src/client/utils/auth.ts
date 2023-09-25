export interface IPowerBIAuth {
	getToken(): Promise<string>;
}
