import { Router } from 'express';

import { projectResolver } from '@src/middleware/project-resolver';
import { serviceResolver } from '@src/middleware/service-resolver';

import { ApiContextV1 } from '../../context';

import actualForecast from './actual-forecast/routes';
import assignmentsController from './assignments/controller';
import capex from './capex/routes';
import dateSettings from './date-settings/routes';
import depreciation from './depreciation/routes';
import differentials from './differentials/routes';
import emissions from './emissions/routes';
import escalation from './escalations/routes';
import expenses from './expenses/routes';
import fluidModels from './fluid-models/routes';
import generalOptions from './general-options/routes';
import ownershipReversions from './ownership-reversions/routes';
import pricing from './pricing/routes';
import productionTaxes from './production-taxes/routes';
import reservesCategories from './reserves-categories/routes';
import risking from './riskings/routes';
import streamProperties from './stream-properties/routes';

const router = Router({ mergeParams: true });

router.use(serviceResolver<ApiContextV1, keyof ApiContextV1>('econModelService', 'econModelService'));
router.use(projectResolver());

// Well/Qualifier econModels Assignments CRUD:
router.use('/:econName/:econModelId/assignments', assignmentsController.routes());

// Individual econModels CRUD:
router.use('/differentials', differentials);
router.use('/emissions', emissions);
router.use('/escalations', escalation);
router.use('/general-options', generalOptions);
router.use('/capex', capex);
router.use('/actual-forecast', actualForecast);
router.use('/fluid-models', fluidModels);
router.use('/ownership-reversions', ownershipReversions);
router.use('/pricing', pricing);
router.use('/depreciation', depreciation);
router.use('/production-taxes', productionTaxes);
router.use('/reserves-categories', reservesCategories);
router.use('/riskings', risking);
router.use('/expenses', expenses);
router.use('/stream-properties', streamProperties);
router.use('/date-settings', dateSettings);

export default router;
