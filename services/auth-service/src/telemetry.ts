import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { 
  ATTR_SERVICE_NAME, 
  ATTR_SERVICE_VERSION
} from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

// Custom attributes for those not available in stable semantic conventions
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment';
const ATTR_SERVICE_NAMESPACE = 'service.namespace';
const ATTR_SERVICE_INSTANCE_ID = 'service.instance.id';

// Initialize OpenTelemetry with latest approach
export function initTelemetry() {
  const serviceName = 'auth-service';
  const serviceVersion = process.env.npm_package_version || '1.0.0';
  const environment = process.env.NODE_ENV || 'development';
  const isDevelopment = environment === 'development';

  console.log(`🔍 Initializing OpenTelemetry for ${serviceName} v${serviceVersion} in ${environment} mode`);

  // Create resource with service attributes
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT]: environment,
    [ATTR_SERVICE_NAMESPACE]: 'devsfit',
    [ATTR_SERVICE_INSTANCE_ID]: process.env.HOSTNAME || 'unknown',
  });

  // Configure trace exporters
  let traceExporter;
  
  if (isDevelopment) {
    // Console exporter for development
    traceExporter = new ConsoleSpanExporter();
    console.log('📝 Console trace exporter enabled for development');
  } else {
    // OTLP exporter for production
    traceExporter = new OTLPTraceExporter({
      url: process.env.JAEGER_ENDPOINT || 'http://jaeger:4318/v1/traces',
    });
    console.log('🔗 OTLP trace exporter enabled for production');
  }

  // Configure Prometheus metrics exporter
  // PrometheusExporter is a pull-based exporter that creates its own HTTP server
  const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
  });
  console.log('📊 Prometheus metrics exporter enabled on port 9464');

  // Configure auto-instrumentations
  const instrumentations = [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable file system instrumentation to reduce noise
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        responseHook: (span, response) => {
          const headers = (response as any).headers;
          if (headers) {
            span.setAttributes({
              'http.response.size': headers['content-length'] || 0,
              'http.response.status_code': (response as any).statusCode || 0,
            });
          }
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        enhancedDatabaseReporting: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-nestjs-core': {
        enabled: true,
      },
    }),
  ];

  // Create SDK configuration
  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: prometheusExporter, // Use PrometheusExporter directly as metricReader
    instrumentations,
  });

  // Start the SDK
  sdk.start();
  
  console.log(`✅ OpenTelemetry SDK started successfully`);
  console.log(`📊 Metrics available at: http://localhost:9464/metrics`);
  
  if (!isDevelopment) {
    console.log(`🔗 Jaeger UI: http://localhost:16686`);
  }

  // Graceful shutdown
  const gracefulShutdown = async () => {
    console.log('🔄 Shutting down OpenTelemetry SDK...');
    try {
      await sdk.shutdown();
      console.log('✅ OpenTelemetry SDK shut down successfully');
    } catch (error) {
      console.error('❌ Error shutting down OpenTelemetry SDK:', error);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return sdk;
} 