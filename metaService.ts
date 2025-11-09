import axios from 'axios';

// Logger interface - replace with your preferred logging library
interface Logger {
  info(message: string, data?: any): void;
  error(message: string, data?: any): void;
  warn(message: string, data?: any): void;
}

// Simple console logger implementation
const logger: Logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
};

export interface MetaMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface MetaSendMessageParams {
  psid: string;
  text: string;
  accessToken: string;
  instagramAccountId?: string; // Optional Instagram Business Account ID for Instagram messaging
}

/**
 * Service for sending messages via Meta Graph API
 * Supports both Facebook Messenger and Instagram Direct Messages
 */
export class MetaService {
  private readonly baseUrl = 'https://graph.facebook.com/v22.0';
  private readonly instagramBaseUrl = 'https://graph.instagram.com/v22.0';

  /**
   * Send a text message to a user via Meta Messenger/Instagram
   * 
   * @param params - Message parameters including recipient PSID and access token
   * @returns Promise<MetaMessageResponse> - Contains message ID and recipient ID
   */
  async sendMessage(params: MetaSendMessageParams): Promise<MetaMessageResponse> {
    const { psid, text, accessToken, instagramAccountId } = params;

    try {
      // For Instagram messaging, use Instagram Graph API with IG Account ID
      // For Messenger, use Facebook Graph API with /me/messages
      const url = instagramAccountId 
        ? `${this.instagramBaseUrl}/${instagramAccountId}/messages`
        : `${this.baseUrl}/me/messages`;
      
      const payload = {
        recipient: { id: psid },
        message: { text },
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      });

      logger.info('Meta message sent successfully', {
        psid,
        messagePreview: text.slice(0, 50),
        platform: instagramAccountId ? 'instagram' : 'messenger',
      });

      return response.data;
    } catch (error: any) {
      logger.error('Meta send message failed', {
        psid,
        error: error?.response?.data || error.message,
        platform: instagramAccountId ? 'instagram' : 'messenger',
      });
      throw new Error(`Failed to send Meta message: ${error?.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get Meta page information
   * 
   * @param pageId - Facebook Page ID
   * @param accessToken - Page access token
   * @returns Promise with page information
   */
  async getPageInfo(pageId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${pageId}`;
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          fields: 'name,id,access_token',
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get page info', {
        pageId,
        error: error?.response?.data || error.message,
      });
      throw new Error('Failed to retrieve page information');
    }
  }

  /**
   * Subscribe app to page webhook events
   * Required for receiving incoming messages
   * 
   * @param pageId - Facebook Page ID
   * @param accessToken - Page access token
   * @returns Promise with subscription confirmation
   */
  async subscribeToWebhook(pageId: string, accessToken: string) {
    try {
      const url = `${this.baseUrl}/${pageId}/subscribed_apps`;
      const response = await axios.post(
        url,
        {
          subscribed_fields: ['messages', 'messaging_postbacks', 'message_echoes'],
        },
        {
          params: { access_token: accessToken },
          timeout: 10000,
        }
      );

      logger.info('Subscribed to page webhook', { pageId });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to subscribe to webhook', {
        pageId,
        error: error?.response?.data || error.message,
      });
      throw new Error('Failed to subscribe to webhook');
    }
  }

  /**
   * Get Instagram Business Account ID for a Facebook Page
   * Required for Instagram messaging
   * 
   * @param pageId - Facebook Page ID
   * @param accessToken - Page access token
   * @returns Promise with Instagram account ID
   */
  async getInstagramAccountId(pageId: string, accessToken: string): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/${pageId}`;
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          fields: 'instagram_business_account',
        },
        timeout: 10000,
      });

      return response.data.instagram_business_account?.id || null;
    } catch (error: any) {
      logger.error('Failed to get Instagram account ID', {
        pageId,
        error: error?.response?.data || error.message,
      });
      return null;
    }
  }
}

export default new MetaService();