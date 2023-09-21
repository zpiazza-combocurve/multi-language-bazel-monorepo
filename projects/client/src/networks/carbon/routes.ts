import { defaultPages, moduleUrls } from '@/routes/generate-routes';

export const networkModelsRoutes = {
	networkModels: 'network-models',
	networkModel: moduleUrls('network-models', {
		...defaultPages,
		view: '',
	}),
	// facilities: 'network-models/facilities', // TODO adjust this one
	facility: moduleUrls('network-models/facilities', {
		...defaultPages,
		view: '',
	}),
} as const;
