import { Request, Response } from 'express';
import { WebhookPayload, WebhookVerification } from './types';

// Simple logger - replace with your preferred logging solution
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ''),
};

// Environment variable for webhook verification
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your-verify-token';

/**
 * Webhook verification (GET request)
 * Meta sends a verification challenge when setting up the webhook
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const verifyWebhook = (req: Request, res: Response) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query as WebhookVerification;

  logger.info('Webhook verification attempt', { mode, token });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    logger.info('Webhook verified successfully');
    return res.status(200).type('text/plain').send(challenge);
  }

  logger.warn('Webhook verification failed');
  return res.status(403).type('text/plain').send('Forbidden');
};

/**
 * Receive webhook events (POST request)
 * Handle incoming messages from Meta (Messenger/Instagram)
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param messageHandler - Callback function to process messages
 */
export const receiveWebhook = async (
  req: Request, 
  res: Response,
  messageHandler: (psid: string, message: string, platform: 'messenger' | 'instagram') => Promise<void>
) => {
  // Always acknowledge webhook immediately
  res.sendStatus(200);

  try {
    const body: WebhookPayload = req.body;
    const merchantId = req.params.merchantId;

    logger.info('Webhook received', {
      merchantId,
      hasEntry: !!body.entry,
      entryCount: body.entry?.length || 0,
    });

    if (!body.entry || body.entry.length === 0) {
      logger.warn('No entries in webhook payload');
      return;
    }

    // Process each entry
    for (const entry of body.entry) {
      // Handle Messenger format
      if ('messaging' in entry && entry.messaging) {
        const messaging = entry.messaging[0];
        if (messaging?.message && messaging?.sender?.id) {
          const psid = messaging.sender.id;
          const text = messaging.message?.text || '';

          logger.info('Messenger message received', {
            merchantId,
            psid,
            messagePreview: text.slice(0, 50),
          });

          // Call the message handler
          await messageHandler(psid, text, 'messenger');
        }
      }

      // Handle Instagram format (changes array)
      if ('changes' in entry && entry.changes) {
        const change = entry.changes[0]?.value;
        
        // Instagram can send messages in two formats:
        // Format 1: change.messages[0] (array of messages)
        // Format 2: change directly contains the message data
        const igMessage = change?.messages?.[0] || (change?.from?.id ? change : null);
        
        if (igMessage?.from?.id) {
          const psid = igMessage.from.id;
          const text = igMessage.text || igMessage.message?.text || '';

          logger.info('Instagram message received', {
            merchantId,
            psid,
            messagePreview: text.slice(0, 50),
            username: igMessage.from.username || 'unknown',
          });

          // Call the message handler
          await messageHandler(psid, text, 'instagram');
        }
      }
    }
  } catch (error: any) {
    logger.error('Webhook processing error', {
      error: error.message,
      stack: error.stack,
    });
  }
};

/**
 * Express route handlers for easy integration
 * Usage:
 * 
 * import express from 'express';
 * import { setupWebhookRoutes } from './webhookController';
 * 
 * const app = express();
 * setupWebhookRoutes(app, async (psid, message, platform) => {
 *   console.log(`Received message from ${psid} on ${platform}: ${message}`);
 *   // Your message processing logic here
 * });
 */
export const setupWebhookRoutes = (
  app: any, // Express app
  messageHandler: (psid: string, message: string, platform: 'messenger' | 'instagram') => Promise<void>
) => {
  // Webhook verification (GET)
  app.get('/webhook/meta', verifyWebhook);
  app.get('/webhook/meta/:merchantId', verifyWebhook);

  // Webhook events (POST)
  app.post('/webhook/meta', (req: Request, res: Response) => 
    receiveWebhook(req, res, messageHandler)
  );
  app.post('/webhook/meta/:merchantId', (req: Request, res: Response) => 
    receiveWebhook(req, res, messageHandler)
  );

  console.log('Webhook routes setup complete:');
  console.log('  GET  /webhook/meta');
  console.log('  POST /webhook/meta');
  console.log('  GET  /webhook/meta/:merchantId');
  console.log('  POST /webhook/meta/:merchantId');
};