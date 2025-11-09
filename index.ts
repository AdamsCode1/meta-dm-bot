/**
 * Main entry point for the Meta DM package
 * Exports all the main functionality for easy importing
 */

// Core service for sending messages
export { default as metaService, MetaService } from './metaService';

// Webhook handling
export { 
  verifyWebhook, 
  receiveWebhook, 
  setupWebhookRoutes 
} from './webhookController';

// Message queue processing
export { 
  processMetaMessage, 
  messageQueue, 
  queueMessage 
} from './metaProcessor';

// TypeScript interfaces
export * from './types';

// Usage example:
// import { metaService, queueMessage, setupWebhookRoutes } from 'meta-dm-package';