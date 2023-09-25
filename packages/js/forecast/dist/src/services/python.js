"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonApiService = void 0;
const shared_1 = require("@combocurve/shared");
const shared_2 = require("@combocurve/shared");
const shared_3 = require("@combocurve/shared");
const google_cloud_caller_1 = require("combocurve-utils/google-cloud-caller");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const { pythonServerUrl, devEnv } = shared_3.config;
// This class/file is a temporary solution. If you are seeing this beyond v34 this should be removed as a top priority!
// Once we can pull the python service out of the internal-api and into its own package then this can be removed.
class PythonApiService extends shared_1.BaseService {
    constructor(context) {
        super(context);
    }
    callPythonApi = async ({ method, url, body, retries, }) => {
        const urlScheme = devEnv ? 'http://' : 'https://';
        const port = devEnv ? 5000 : 443;
        const authObject = await (0, google_cloud_caller_1.getAuthHeader)(urlScheme + pythonServerUrl);
        const authHeader = authObject.Authorization;
        const options = {
            hostname: pythonServerUrl,
            port: port,
            path: url,
            method: method,
            headers: {
                authorization: authHeader,
                'content-type': 'application/json',
                'inpt-db-connection-string': this.context.tenant.dbConnectionString,
                'inpt-db-name': this.context.tenant.dbName,
                'inpt-db-username': this.context.tenant.dbUsername,
                'inpt-db-password': this.context.tenant.dbPassword,
                'inpt-db-cluster': this.context.tenant.dbCluster,
                'inpt-pusher-app-id': this.context.tenant.pusherAppId,
                'inpt-pusher-key': this.context.tenant.pusherKey,
                'inpt-pusher-secret': this.context.tenant.pusherSecret,
                'inpt-pusher-cluster': this.context.tenant.pusherCluster,
                'inpt-file-storage-bucket': this.context.tenant.fileStorageBucket,
                'inpt-batch-storage-bucket': this.context.tenant.batchStorageBucket,
                'inpt-econ-storage-bucket': this.context.tenant.econStorageBucket,
                'inpt-archive-storage-bucket': this.context.tenant.archiveStorageBucket,
                'inpt-import-queue': this.context.tenant.importQueue,
                'inpt-big-query-dataset': this.context.tenant.bigQueryDataset,
            },
        };
        let req;
        if (devEnv) {
            req = http_1.default.request(options, (res) => {
                res.on('data', (d) => {
                    process.stdout.write(d);
                });
            });
        }
        else {
            req = https_1.default.request(options, (res) => {
                res.on('data', (d) => {
                    process.stdout.write(d);
                });
            });
        }
        req.on('error', (error) => {
            shared_2.logger.error(`There was an error calling python_apis from the forecast-service for ${this.context.tenant.name}: ${error}`);
            if (retries > 0) {
                this.callPythonApi({ method, url, body, retries: retries - 1 });
                shared_2.logger.debug(`Retrying python api call from the forecast-service for ${this.context.tenant.name}`);
            }
        });
        req.write(JSON.stringify(body));
        req.end();
    };
    //When we deprecate this file, the following method should be moved to python-service.ts:
    updateEur = ({ body, retries = 1, }) => {
        return this.callPythonApi({
            method: 'POST',
            url: '/update_eur',
            body,
            retries,
        });
    };
}
exports.PythonApiService = PythonApiService;
