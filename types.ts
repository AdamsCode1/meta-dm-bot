/**
 * TypeScript interfaces and types for Meta DM functionality
 */

// Core message interfaces
export interface MetaMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface MetaSendMessageParams {
  psid: string;
  text: string;
  accessToken: string;
  instagramAccountId?: string;
}

// Webhook payload interfaces
export interface MessengerWebhookEntry {
  messaging: MessengerMessage[];
}

export interface InstagramWebhookEntry {
  changes: InstagramChange[];
}

export interface MessengerMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message: {
    mid: string;
    text: string;
  };
}

export interface InstagramChange {
  value: {
    messages?: InstagramMessage[];
    from?: { id: string; username?: string };
    text?: string;
    message?: { text: string };
  };
}

export interface InstagramMessage {
  from: {
    id: string;
    username?: string;
  };
  id: string;
  created_time: string;
  text?: string;
  message?: {
    text: string;
  };
}

export interface WebhookPayload {
  object: 'page' | 'instagram';
  entry: (MessengerWebhookEntry | InstagramWebhookEntry)[];
}

// Job queue interfaces
export interface MetaApiJobData {
  merchantId?: string;
  psid: string;
  text: string;
  dmLogId?: string;
  instagramAccountId?: string;
}

export interface WebhookJobData {
  merchantId?: string;
  psid: string;
  message: string;
  correlationId?: string;
}

// Meta API error response
export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

// Page information interface
export interface PageInfo {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
  };
}

// Instagram account interface
export interface InstagramAccount {
  id: string;
  username: string;
}

// Webhook verification parameters
export interface WebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}