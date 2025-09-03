// ===================
// ANALYTICS EVENT TYPES
// ===================

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventName: string;
  companyId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
  category: string;
  data: any;
  metadata?: any;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnalyticsEvent {
  eventType: string;
  eventName: string;
  companyId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
  category: string;
  data: any;
  metadata?: any;
}

export interface AnalyticsEventFilters {
  eventType?: string;
  eventName?: string;
  companyId?: string;
  userId?: string;
  source?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  processed?: boolean;
  page?: number;
  limit?: number;
}

// ===================
// BUSINESS METRICS TYPES
// ===================

export interface BusinessMetrics {
  id: string;
  companyId: string;
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  comparisonValue?: number;
  changePercentage?: number;
  trend?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessMetrics {
  companyId: string;
  metricType: string;
  metricName: string;
  value: number;
  unit?: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  comparisonValue?: number;
  changePercentage?: number;
  trend?: string;
  metadata?: any;
}

export interface BusinessMetricsFilters {
  companyId?: string;
  metricType?: string;
  metricName?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ===================
// USER ANALYTICS TYPES
// ===================

export interface UserAnalytics {
  id: string;
  userId: string;
  companyId?: string;
  sessionId?: string;
  pageViews: number;
  timeSpent: number;
  actions?: any;
  deviceInfo?: any;
  location?: any;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionStart: Date;
  sessionEnd?: Date;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAnalytics {
  userId: string;
  companyId?: string;
  sessionId?: string;
  pageViews?: number;
  timeSpent?: number;
  actions?: any;
  deviceInfo?: any;
  location?: any;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionStart: Date;
  sessionEnd?: Date;
  isActive?: boolean;
  metadata?: any;
}

export interface UserAnalyticsFilters {
  userId?: string;
  companyId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ===================
// PERFORMANCE METRICS TYPES
// ===================

export interface PerformanceMetrics {
  id: string;
  serviceName: string;
  endpoint?: string;
  method?: string;
  responseTime: number;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestSize?: number;
  responseSize?: number;
  timestamp: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePerformanceMetrics {
  serviceName: string;
  endpoint?: string;
  method?: string;
  responseTime: number;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestSize?: number;
  responseSize?: number;
  metadata?: any;
}

export interface PerformanceMetricsFilters {
  serviceName?: string;
  endpoint?: string;
  method?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ===================
// REVENUE ANALYTICS TYPES
// ===================

export interface RevenueAnalytics {
  id: string;
  companyId?: string;
  revenueType: string;
  amount: number;
  currency: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  subscriptionCount?: number;
  newSubscriptions?: number;
  cancellations?: number;
  churnRate?: number;
  mrr?: number;
  arr?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRevenueAnalytics {
  companyId?: string;
  revenueType: string;
  amount: number;
  currency?: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  subscriptionCount?: number;
  newSubscriptions?: number;
  cancellations?: number;
  churnRate?: number;
  mrr?: number;
  arr?: number;
  metadata?: any;
}

export interface RevenueAnalyticsFilters {
  companyId?: string;
  revenueType?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ===================
// FEATURE USAGE TYPES
// ===================

export interface FeatureUsage {
  id: string;
  companyId?: string;
  userId?: string;
  featureName: string;
  featureCategory?: string;
  usageCount: number;
  usageDuration?: number;
  lastUsed: Date;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureUsage {
  companyId?: string;
  userId?: string;
  featureName: string;
  featureCategory?: string;
  usageCount?: number;
  usageDuration?: number;
  lastUsed: Date;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  metadata?: any;
}

export interface FeatureUsageFilters {
  companyId?: string;
  userId?: string;
  featureName?: string;
  featureCategory?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ===================
// DASHBOARD TYPES
// ===================

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  companyId?: string;
  userId?: string;
  isPublic: boolean;
  isDefault: boolean;
  layout: any;
  widgets: any;
  filters?: any;
  refreshInterval?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDashboardConfig {
  name: string;
  description?: string;
  companyId?: string;
  userId?: string;
  isPublic?: boolean;
  isDefault?: boolean;
  layout: any;
  widgets: any;
  filters?: any;
  refreshInterval?: number;
  metadata?: any;
}

export interface DashboardConfigFilters {
  companyId?: string;
  userId?: string;
  isPublic?: boolean;
  isDefault?: boolean;
  page?: number;
  limit?: number;
}

// ===================
// REPORT TEMPLATE TYPES
// ===================

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  query: string;
  parameters?: any;
  schedule?: any;
  recipients?: any;
  format: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportTemplate {
  name: string;
  description?: string;
  category: string;
  isActive?: boolean;
  query: string;
  parameters?: any;
  schedule?: any;
  recipients?: any;
  format?: string;
  metadata?: any;
}

export interface ReportTemplateFilters {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ===================
// DATA EXPORT TYPES
// ===================

export interface DataExport {
  id: string;
  name: string;
  description?: string;
  companyId?: string;
  userId?: string;
  exportType: string;
  status: ExportStatus;
  format: string;
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
  expiresAt?: Date;
  filters?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDataExport {
  name: string;
  description?: string;
  companyId?: string;
  userId?: string;
  exportType: string;
  format?: string;
  expiresAt?: Date;
  filters?: any;
  metadata?: any;
}

export interface DataExportFilters {
  companyId?: string;
  userId?: string;
  exportType?: string;
  status?: ExportStatus;
  format?: string;
  page?: number;
  limit?: number;
}

export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

// ===================
// ANALYTICS DASHBOARD TYPES
// ===================

export interface AnalyticsDashboard {
  totalEvents: number;
  totalUsers: number;
  totalRevenue: number;
  conversionRate: number;
  topEvents: Array<{
    eventName: string;
    count: number;
    percentage: number;
  }>;
  topFeatures: Array<{
    featureName: string;
    usageCount: number;
    percentage: number;
  }>;
  revenueTrend: Array<{
    period: string;
    amount: number;
    change: number;
  }>;
  userGrowth: Array<{
    period: string;
    newUsers: number;
    totalUsers: number;
  }>;
}

export interface AnalyticsSummary {
  period: string;
  totalEvents: number;
  uniqueUsers: number;
  totalRevenue: number;
  averageSessionDuration: number;
  topPerformingFeatures: string[];
  conversionFunnel: {
    step1: number;
    step2: number;
    step3: number;
    conversion: number;
  };
}

// ===================
// SERVICE INTEGRATION TYPES
// ===================

export interface ServiceMetrics {
  serviceName: string;
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  successRate: number;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
    averageTime: number;
  }>;
  errors: Array<{
    endpoint: string;
    errorMessage: string;
    count: number;
  }>;
}

export interface BusinessIntelligence {
  mrr: number;
  arr: number;
  churnRate: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  revenueGrowth: number;
  userGrowth: number;
  featureAdoption: {
    featureName: string;
    adoptionRate: number;
    usageCount: number;
  }[];
}

// ===================
// REAL-TIME ANALYTICS TYPES
// ===================

export interface RealTimeMetrics {
  activeUsers: number;
  currentSessions: number;
  eventsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  topActiveFeatures: string[];
  recentEvents: Array<{
    eventName: string;
    timestamp: Date;
    userId?: string;
    companyId?: string;
  }>;
}

export interface AnalyticsAlert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  isActive: boolean;
  recipients: string[];
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ===================
// DATA PROCESSING TYPES
// ===================

export interface DataProcessingJob {
  id: string;
  type: 'analytics' | 'metrics' | 'cleanup' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  errorMessage?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingConfig {
  batchSize: number;
  processingInterval: number;
  retentionDays: number;
  cleanupEnabled: boolean;
  realTimeEnabled: boolean;
  maxConcurrentJobs: number;
}
