/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

export const initializeNetworkNodeFactory = () => {
	return Factory.define<any>(() => {
		return {
			id: faker.datatype.uuid(),
			name: faker.lorem.word(),
			shape: { position: { x: 0, y: 0 } },
		};
	});
};
