// import opentelemetry from '@opentelemetry/api';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { CloudPropagator } from '@google-cloud/opentelemetry-cloud-trace-propagator';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes as ResourceAttributesSC } from '@opentelemetry/semantic-conventions';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';

import config from '@src/config';

if (config.isDebug) {
	diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
}

// Enable OpenTelemetry exporters to export traces to Google Cloud Trace.
// Exporters use Application Default Credentials (ADCs) to authenticate.
// See https://developers.google.com/identity/protocols/application-default-credentials
// for more details.
const provider = new NodeTracerProvider({
	resource: new Resource({
		[ResourceAttributesSC.SERVICE_NAME]: config.serviceName,
	}),
});

// Initialize the exporter. When your application is running on Google Cloud,
// you don't need to provide auth credentials or a project id.
const exporter =
	config.environment == 'production'
		? new TraceExporter({
				projectId: config.gcpPrimaryProjectId,
		  })
		: new ConsoleSpanExporter();

// Configure the span processor to send spans to the exporter
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

const propagator = new CloudPropagator();

// Initialize the provider
provider.register({
	propagator,
});

if (config.environment == 'production') {
	registerInstrumentations({
		instrumentations: [
			new HttpInstrumentation(),
			new ExpressInstrumentation(),
			new MongoDBInstrumentation({
				enhancedDatabaseReporting: true,
			}),
			new WinstonInstrumentation({
				logHook: (span, record) => {
					record[LoggingWinston.LOGGING_TRACE_KEY] = `projects/${config.gcpPrimaryProjectId}/traces/${
						span.spanContext().traceId
					}`;
				},
			}),
		],
	});
}
