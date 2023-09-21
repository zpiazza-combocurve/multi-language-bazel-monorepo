import { rest } from 'msw';

import { API_BASE_URL } from '@/helpers/routing/routing-shared';
import { local } from '@/helpers/storage';

import { GroupConfiguration } from './types';

const baseGroupUrl = `${API_BASE_URL}/scenarios/group-configurations`;

export const handlers = [
	rest.get(`${baseGroupUrl}/`, (req, res, ctx) => {
		const groupConfigurations = local.getItem('group-configurations');
		return res(ctx.status(200), ctx.json(groupConfigurations as GroupConfiguration[]));
	}),
	rest.post(`${baseGroupUrl}/`, async (req, res, ctx) => {
		const groupConfiguration = await req.json();
		const groupConfigurations = local.getItem('group-configurations');
		local.setItem('group-configurations', [...groupConfigurations, groupConfiguration]);
		return res(ctx.status(200), ctx.json(groupConfiguration as GroupConfiguration));
	}),
	rest.get(`${baseGroupUrl}/default`, (req, res, ctx) => {
		const defaultGroupConfiguration = local.getItem('default-group-configuration');
		return res(ctx.status(200), ctx.json(defaultGroupConfiguration as GroupConfiguration));
	}),
	rest.post(`${baseGroupUrl}/default`, async (req, res, ctx) => {
		const { _id } = (await req.json()) ?? {};
		const configs = local.getItem('group-configurations');
		const groupConfig = configs.find(({ _id: _id1 }) => _id === _id1) ?? {};
		local.setItem('default-group-configuration', groupConfig);
		return res(ctx.status(200), ctx.json(groupConfig as GroupConfiguration));
	}),
];

export default handlers;
