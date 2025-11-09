import metaService from './metaService';
import { MetaApiJobData } from './types';

// Simple logger - replace with your preferred logging solution
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
};

/**
 * Process Meta API message sending with queue support
 * This can be integrated with any job queue system (Bull, Agenda, etc.)
 * 
 * @param jobData - Message job data
 * @returns Promise with success status and message ID
 */
export const processMetaMessage = async (jobData: MetaApiJobData) => {
  const { psid, text, dmLogId, instagramAccountId } = jobData;

  logger.info('Processing Meta API job', {
    psid,
    dmLogId,
    platform: instagramAccountId ? 'instagram' : 'messenger',
  });

  try {
    // You would typically get the access token from your database/config
    // For this example, we'll get it from environment variables
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Meta access token not configured');
    }

    // Send message using the meta service
    const result = await metaService.sendMessage({
      psid,
      text,
      accessToken,
      instagramAccountId,
    });

    logger.info('Meta message sent successfully', {
      messageId: result.message_id,
      dmLogId,
    });

    return { success: true, messageId: result.message_id };
  } catch (error: any) {
    logger.error('Meta API job failed', {
      psid,
      error: error.message,
      dmLogId,
    });

    throw error;
  }
};

/**
 * Simple queue implementation for demonstration
 * Replace with your preferred queue system (Bull, Agenda, etc.)
 */
class SimpleMessageQueue {
  private queue: MetaApiJobData[] = [];
  private processing = false;

  /**
   * Add a message to the queue
   */
  async add(jobData: MetaApiJobData): Promise<void> {
    this.queue.push(jobData);
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process queued messages
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const jobData = this.queue.shift();
      if (!jobData) continue;

      try {
        await processMetaMessage(jobData);
        
        // Add delay between messages to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error('Failed to process queued message', { jobData, error });
        
        // Optional: Add retry logic here
        // For now, we'll just log the error and continue
      }
    }

    this.processing = false;
  }
}

// Export a singleton instance
export const messageQueue = new SimpleMessageQueue();

/**
 * Convenience function to queue a message for sending
 * 
 * @param psid - Recipient's page-scoped ID
 * @param text - Message text to send
 * @param instagramAccountId - Optional Instagram account ID for Instagram messaging
 * @param dmLogId - Optional log ID for tracking
 */
export const queueMessage = async (
  psid: string,
  text: string,
  instagramAccountId?: string,
  dmLogId?: string
): Promise<void> => {
  await messageQueue.add({
    psid,
    text,
    instagramAccountId,
    dmLogId,
  });
};