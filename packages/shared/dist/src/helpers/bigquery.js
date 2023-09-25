"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBigQueryClient = void 0;
const bigquery_1 = require("@google-cloud/bigquery");
// docs: https://googleapis.dev/nodejs/bigquery/latest/BigQuery.html
const initBigQueryClient = (projectId) => new bigquery_1.BigQuery({ projectId });
exports.initBigQueryClient = initBigQueryClient;
//# sourceMappingURL=bigquery.js.map