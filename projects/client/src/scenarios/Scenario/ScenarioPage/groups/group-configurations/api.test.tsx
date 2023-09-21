import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks/dom';
import { setupServer } from 'msw/node';

import { local } from '@/helpers/storage';
import { TestWrapper } from '@/helpers/testing';

import { useDefaultGroupConfiguration, useGroupConfigurations } from './api';
import handlers from './api.mock';
import { GroupConfiguration } from './types';

describe.skip('Econ Group', () => {
	describe('Group Configuration', () => {
		describe('api', () => {
			const configs = [
				{ _id: 'id1', name: 'Config 1' },
				{ _id: 'id2', name: 'Config 2' },
			] as GroupConfiguration[];

			const server = setupServer(...handlers);
			beforeAll(() => server.listen());
			afterEach(() => server.resetHandlers());
			beforeEach(() => local.setItem('group-configurations', configs));
			afterEach(() => local.clear());
			afterAll(() => server.close());

			describe('useConfigurations', () => {
				it('should work', () => {
					renderHook(() => useGroupConfigurations(), { wrapper: TestWrapper });
				});
				it('should show configurations', async () => {
					const { result } = renderHook(() => useGroupConfigurations(), { wrapper: TestWrapper });

					await waitFor(() => expect(result.current.isLoadingConfigurations).toBe(false));

					expect(result.current.configurations?.length).toBe(2);
					expect(result.current.configurations?.[1].name).toBe('Config 2');
				});

				it('should add configurations', async () => {
					const { result } = renderHook(() => useGroupConfigurations(), { wrapper: TestWrapper });
					await waitFor(() => expect(result.current.isLoadingConfigurations).toBe(false));

					expect(result.current.configurations?.length).toBe(2);

					result.current.handleCreateConfiguration({ name: 'Config 3' } as GroupConfiguration);
					await waitFor(() => expect(result.current.isFetchingConfigurations).toBe(false));

					expect(result.current.configurations?.length).toBe(3);
					expect(result.current.configurations?.[0].name).toBe('Config 1');
					expect(result.current.configurations?.[2].name).toBe('Config 3');
				});
			});

			describe('useDefaultConfiguration', () => {
				it('should work', () => {
					renderHook(() => useDefaultGroupConfiguration(), { wrapper: TestWrapper });
				});

				it('should show default config', async () => {
					const config = { name: 'Config 1' } as GroupConfiguration;

					local.setItem('default-group-configuration', config);

					const { result } = renderHook(() => useDefaultGroupConfiguration(), { wrapper: TestWrapper });

					await waitFor(() => expect(result.current.isLoadingDefaultConfiguration).toBe(false));

					expect(result.current.defaultConfiguration).toMatchObject(config);
				});

				it('should change default config', async () => {
					local.setItem('default-group-configuration', configs[0]);

					const { result } = renderHook(() => useDefaultGroupConfiguration(), { wrapper: TestWrapper });

					await waitFor(() => expect(result.current.isLoadingDefaultConfiguration).toBe(false));

					expect(result.current.defaultConfiguration).toMatchObject(configs[0]);

					result.current.setDefaultConfiguration(configs[1]);

					await waitFor(() => expect(result.current.isFetchingDefaultConfiguration).toBe(false));

					expect(result.current.defaultConfiguration).toMatchObject(configs[1]);
				});

				it('should remove default config', async () => {
					local.setItem('default-group-configuration', configs[0]);

					const { result } = renderHook(() => useDefaultGroupConfiguration(), { wrapper: TestWrapper });

					await waitFor(() => expect(result.current.isLoadingDefaultConfiguration).toBe(false));

					expect(result.current.defaultConfiguration).toMatchObject(configs[0]);

					result.current.setDefaultConfiguration(null);

					await waitFor(() => expect(result.current.isFetchingDefaultConfiguration).toBe(false));

					expect(result.current.defaultConfiguration?._id).toBe(undefined);
				});
			});
		});
	});
});
