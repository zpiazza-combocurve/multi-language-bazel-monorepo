"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceResolver = exports.ForecastService = exports.MAX_WELLS_IN_FORECAST = void 0;
const shared_1 = require("@combocurve/shared");
const middleware_1 = require("@combocurve/shared/middleware");
Object.defineProperty(exports, "serviceResolver", { enumerable: true, get: function () { return middleware_1.serviceResolver; } });
const mongoose_1 = require("mongoose");
const forecast_1 = require("../entities/forecast");
const math_1 = require("../helpers/math");
const multipleSegments_1 = __importDefault(require("../models/multipleSegments"));
exports.MAX_WELLS_IN_FORECAST = 25_000;
class ForecastService extends shared_1.BaseService {
    constructor(context) {
        super(context);
    }
    addWellsToForecast = async (forecastId, inputForecastWells) => {
        const { project: projectId, wells: forecastWells, type } = await this.getForecast(forecastId);
        const wellSet = new Set(inputForecastWells.map((y) => y.toString()));
        for (let i = 0, len = forecastWells.length; i < len; i++) {
            wellSet.delete(forecastWells[i].toString());
        }
        const wellsToAdd = [...wellSet];
        if (wellsToAdd.length + forecastWells.length > exports.MAX_WELLS_IN_FORECAST) {
            const response = {
                message: `Wells Added Exceed ${exports.MAX_WELLS_IN_FORECAST} Well Forecast Limit`,
                wellsIds: [],
            };
            return response;
        }
        while (wellsToAdd.length) {
            const forecastDataModel = [];
            const wellForecastAssignments = [];
            const curWells = wellsToAdd.splice(0, 200);
            for (let i = 0, len = curWells.length; i < len; i++) {
                const wellId = curWells[i];
                const data = { oil: mongoose_1.Types.ObjectId(), gas: new mongoose_1.Types.ObjectId(), water: new mongoose_1.Types.ObjectId() };
                wellForecastAssignments.push({
                    data,
                    forecast: forecastId,
                    well: mongoose_1.Types.ObjectId(wellId),
                });
                forecast_1.FORECAST_BASE_PHASES.forEach((phase) => {
                    forecastDataModel.push({
                        _id: data[phase],
                        data_freq: 'monthly',
                        forecast: forecastId,
                        forecastType: 'not_forecasted',
                        P_dict: {},
                        p_extra: {},
                        phase,
                        project: projectId,
                        warning: { status: false, message: '' },
                        well: mongoose_1.Types.ObjectId(wellId),
                    });
                });
            }
            await this.saveForecastWellAssignment(type, wellForecastAssignments, forecastDataModel);
        }
        const forecastUpdated = await this.updateForecastWellsAndGetForecast(forecastId, wellSet);
        const response = {
            message: `Successfully Added ${wellSet.size} well(s) To Forecast`,
            wellsIds: forecastUpdated.wells.map((wellId) => wellId.toString()),
        };
        return response;
    };
    getForecast = async (forecastId) => {
        return (await this.context.models.ForecastModel.findOne({ _id: forecastId }))?.toObject();
    };
    getMultipleSegments = async (segments) => {
        const multipleSegments = new multipleSegments_1.default(segments);
        return multipleSegments;
    };
    postDeterministicForecastSegments = async (forecastId, wellId, phase, series, segments) => {
        const location = `P_dict.${series}.segments`;
        const queryParams = { forecast: forecastId, phase: phase, well: wellId };
        await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
            $push: { [location]: { $each: segments } },
            $set: {
                forecasted: true,
                forecastType: 'rate',
                forecastSubType: 'external_integration',
                status: 'in_progress',
                reviewedAt: null,
                reviewedBy: null,
            },
        });
        let segmentsId = (await this.context.models.DeterministicForecastDataModel.findOne(queryParams)
            .select({ _id: 1 })
            .lean());
        return segmentsId;
    };
    getDeterministicForecastSegments = async (forecastId, wellId, phase, series) => {
        const location = `P_dict.${series}.segments`;
        const queryParams = { forecast: forecastId, phase: phase, well: wellId };
        const results = (await this.context.models.DeterministicForecastDataModel.findOne(queryParams, { _id: 0, [location]: 1 }))?.toObject() || {};
        const segments = results.P_dict?.best?.segments || [];
        return segments;
    };
    deleteDeterministicForecastSegments = async (forecastId, wellId, phase, series) => {
        const location = `P_dict.${series}.segments`;
        const queryParams = { forecast: forecastId, phase: phase, well: wellId };
        await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
            $set: {
                [location]: [],
                forecasted: false,
                forecastType: 'not_forecasted',
                forecastSubType: null,
                status: 'in_progress',
                reviewedAt: null,
                reviewedBy: null,
            },
        });
    };
    putDeterministicForecastSegments = async (forecastId, wellId, phase, series, segments) => {
        const location = `P_dict.${series}.segments`;
        const queryParams = { forecast: forecastId, phase: phase, well: wellId };
        await this.context.models.DeterministicForecastDataModel.findOneAndUpdate(queryParams, {
            $set: {
                [location]: segments,
                forecasted: true,
                forecastType: 'rate',
                forecastSubType: 'external_integration',
                status: 'in_progress',
                reviewedAt: null,
                reviewedBy: null,
            },
        });
        let segmentsId = (await this.context.models.DeterministicForecastDataModel.findOne(queryParams)
            .select({ _id: 1 })
            .lean());
        return segmentsId;
    };
    getForecastParams = async (forecastId) => {
        return (await this.context.models.ForecastDataModel.findOne({ _id: forecastId }))?.toObject();
    };
    saveForecastWellAssignment = async (forecastType, assignmentWellForecast, forecastData) => {
        //are these transactions using unit of work?
        await this.context.models.ForecastWellAssignmentModel.insertMany(assignmentWellForecast);
        if (forecastType === forecast_1.FORECAST_TYPES.Probabilistic) {
            await this.context.models.ForecastDataModel.insertMany(forecastData);
        }
        else {
            await this.context.models.DeterministicForecastDataModel.insertMany(forecastData);
        }
    };
    updateForecastWellsAndGetForecast = async (forecastId, wellsToAdd) => {
        return (await this.context.models.ForecastModel.findOneAndUpdate({ _id: forecastId }, { $push: { wells: [...wellsToAdd] } }, { new: true }))?.toObject();
    };
    toApiForecastSegment = (forecastSegment) => {
        return {
            b: forecastSegment?.b,
            flatValue: forecastSegment?.c,
            diEffSec: forecastSegment?.D_eff,
            slope: forecastSegment?.k,
            endDate: (0, math_1.convertIdxToDate)(forecastSegment?.end_idx).toISOString().slice(0, 10),
            segmentType: forecastSegment?.name,
            qEnd: forecastSegment?.q_end,
            qStart: forecastSegment?.q_start,
            startDate: (0, math_1.convertIdxToDate)(forecastSegment.start_idx).toISOString().slice(0, 10),
            targetDSwEffSec: forecastSegment?.target_D_eff_sw,
        };
    };
}
exports.ForecastService = ForecastService;
