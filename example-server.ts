/**
 * Example Express.js server demonstrating Meta DM package usage
 * This shows how to integrate the package into your application
 */

import express from 'express';
import dotenv from 'dotenv';
import { setupWebhookRoutes } from './webhookController';
import { queueMessage } from './metaProcessor';
import metaService from './metaService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Message handler function
const handleIncomingMessage = async (
  psid: string, 
  message: string, 
  platform: 'messenger' | 'instagram'
) => {
  console.log(`📨 Message received from ${psid} on ${platform}: ${message}`);
  
  try {
    // Example: Order tracking
    const orderMatch = message.match(/^#?(\d+)$/);
    if (orderMatch) {
      const orderNumber = orderMatch[1];
      await queueMessage(psid, `📦 Looking up order #${orderNumber}...`);
      
      // Simulate order lookup
      setTimeout(async () => {
        await queueMessage(psid, `✅ Order #${orderNumber} is being processed and will ship within 2-3 business days.`);
      }, 2000);
      
      return;
    }
    
    // Example: FAQ handling
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help')) {
      await queueMessage(psid, 
        '🤝 How can I help you?\n\n' +
        '• Send an order number (e.g., #1234) to track your order\n' +
        '• Ask about "shipping", "returns", or "hours"\n' +
        '• Type "support" to speak with a human'
      );
      return;
    }
    
    if (lowerMessage.includes('shipping')) {
      await queueMessage(psid, 
        '🚚 Shipping Information\n\n' +
        '• Free shipping on orders over $50\n' +
        '• Standard delivery: 3-5 business days\n' +
        '• Express shipping available at checkout'
      );
      return;
    }
    
    if (lowerMessage.includes('return')) {
      await queueMessage(psid, 
        '🔄 Returns & Refunds\n\n' +
        '• 30-day return policy\n' +
        '• Items must be unused and in original packaging\n' +
        '• Start a return: https://example.com/returns'
      );
      return;
    }
    
    if (lowerMessage.includes('hours')) {
      await queueMessage(psid, 
        '🕐 Store Hours\n\n' +
        'Monday - Friday: 9:00 AM - 8:00 PM\n' +
        'Saturday - Sunday: 10:00 AM - 6:00 PM\n' +
        'Holiday hours may vary'
      );
      return;
    }
    
    if (lowerMessage.includes('support')) {
      await queueMessage(psid, 
        '👋 A team member will be with you shortly!\n\n' +
        'For urgent matters, call us at (555) 123-4567\n' +
        'Email: support@example.com'
      );
      return;
    }
    
    // Default response
    await queueMessage(psid, 
      '👋 Thanks for reaching out! I understand you said: "' + message + '"\n\n' +
      'Type "help" to see what I can assist you with, or a team member will respond shortly.'
    );
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await queueMessage(psid, '😅 Sorry, something went wrong. Please try again or contact support.');
  }
};

// Setup webhook routes
setupWebhookRoutes(app, handleIncomingMessage);

// Additional API endpoints
app.get('/api/send-test', async (req, res) => {
  const { psid, message } = req.query;
  
  if (!psid || !message) {
    return res.status(400).json({ 
      error: 'Missing required parameters: psid and message' 
    });
  }
  
  try {
    await queueMessage(psid as string, message as string);
    res.json({ success: true, message: 'Message queued successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/page-info', async (req, res) => {
  const { pageId } = req.query;
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  
  if (!pageId || !accessToken) {
    return res.status(400).json({ 
      error: 'Missing pageId parameter or access token not configured' 
    });
  }
  
  try {
    const pageInfo = await metaService.getPageInfo(pageId as string, accessToken);
    res.json(pageInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get page info' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/meta`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🛠️  Development Tips:');
    console.log('• Use ngrok to expose your local server: ngrok http 3000');
    console.log('• Test message sending: GET /api/send-test?psid=YOUR_PSID&message=Hello');
    console.log('• Check page info: GET /api/page-info?pageId=YOUR_PAGE_ID');
  }
});

export default app;