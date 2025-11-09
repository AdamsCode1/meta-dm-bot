# API Examples & Usage Patterns

This document provides practical examples of how to use the Meta DM package for sending and receiving messages.

## 🚀 Quick Start Example

```typescript
import express from 'express';
import { setupWebhookRoutes } from './webhookController';
import { queueMessage } from './metaProcessor';
import metaService from './metaService';

const app = express();
app.use(express.json());

// Setup webhook routes to receive messages
setupWebhookRoutes(app, async (psid, message, platform) => {
  console.log(`Received message from ${psid} on ${platform}: ${message}`);
  
  // Echo the message back
  await queueMessage(psid, `You said: ${message}`);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 📨 Sending Messages

### Basic Message Sending

```typescript
import metaService from './metaService';

// Send a Facebook Messenger message
const result = await metaService.sendMessage({
  psid: 'recipient-psid',
  text: 'Hello from Messenger!',
  accessToken: 'your-access-token'
});

console.log('Message ID:', result.message_id);
```

### Instagram DM Sending

```typescript
// Send an Instagram DM (requires Instagram Business Account ID)
const result = await metaService.sendMessage({
  psid: 'recipient-psid',
  text: 'Hello from Instagram!',
  accessToken: 'your-access-token',
  instagramAccountId: 'your-instagram-business-account-id'
});
```

### Queued Message Sending (Recommended)

```typescript
import { queueMessage } from './metaProcessor';

// Queue a message for reliable delivery
await queueMessage(
  'recipient-psid',
  'Your order has been shipped!',
  'instagram-account-id', // Optional for Instagram
  'log-id-123' // Optional for tracking
);
```

## 📥 Receiving Messages

### Basic Webhook Handler

```typescript
import { receiveWebhook } from './webhookController';

app.post('/webhook/meta', (req, res) => {
  receiveWebhook(req, res, async (psid, message, platform) => {
    console.log(`Message from ${psid}: ${message}`);
    
    // Your message processing logic here
    if (message.toLowerCase().includes('help')) {
      await queueMessage(psid, 'How can I help you?');
    }
  });
});
```

### Advanced Message Processing

```typescript
const handleMessage = async (psid: string, message: string, platform: 'messenger' | 'instagram') => {
  try {
    // Order tracking example
    if (message.match(/^#?\d+$/)) {
      const orderNumber = message.replace('#', '');
      const orderInfo = await lookupOrder(orderNumber);
      
      if (orderInfo) {
        await queueMessage(psid, `Order ${orderNumber}: ${orderInfo.status}`);
      } else {
        await queueMessage(psid, `Order ${orderNumber} not found.`);
      }
      return;
    }
    
    // FAQ handling
    if (message.toLowerCase().includes('shipping')) {
      await queueMessage(psid, 'We offer free shipping on orders over $50!');
      return;
    }
    
    // Default response
    await queueMessage(psid, 'Thanks for your message! Our team will get back to you soon.');
    
  } catch (error) {
    console.error('Error processing message:', error);
    await queueMessage(psid, 'Sorry, something went wrong. Please try again.');
  }
};

setupWebhookRoutes(app, handleMessage);
```

## 🔧 Service Integration Examples

### Express.js Integration

```typescript
import express from 'express';
import { verifyWebhook, receiveWebhook } from './webhookController';

const app = express();
app.use(express.json());

// Manual route setup
app.get('/webhook/meta', verifyWebhook);
app.post('/webhook/meta', (req, res) => {
  receiveWebhook(req, res, async (psid, message, platform) => {
    // Handle message
  });
});

app.listen(3000);
```

### Next.js API Route

```typescript
// pages/api/webhook/meta.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhook, receiveWebhook } from '../../../webhookController';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    verifyWebhook(req as any, res as any);
  } else if (req.method === 'POST') {
    receiveWebhook(req as any, res as any, async (psid, message, platform) => {
      // Handle message
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
```

### Fastify Integration

```typescript
import Fastify from 'fastify';

const fastify = Fastify();

fastify.get('/webhook/meta', async (request, reply) => {
  // Adapt Express middleware for Fastify
  const req = request.raw;
  const res = reply.raw;
  verifyWebhook(req as any, res as any);
});

fastify.post('/webhook/meta', async (request, reply) => {
  const req = request.raw;
  const res = reply.raw;
  receiveWebhook(req as any, res as any, async (psid, message, platform) => {
    // Handle message
  });
});
```

## 🎯 Use Case Examples

### E-commerce Order Tracking

```typescript
const handleOrderTracking = async (psid: string, message: string) => {
  const orderMatch = message.match(/^#?(\d+)$/);
  
  if (orderMatch) {
    const orderNumber = orderMatch[1];
    
    try {
      // Look up order in your system
      const order = await getOrderByNumber(orderNumber);
      
      if (!order) {
        await queueMessage(psid, `❌ Order #${orderNumber} not found. Please check the number and try again.`);
        return;
      }
      
      // Send order status
      const statusMessage = `📦 Order #${orderNumber}\n\n` +
        `Status: ${order.status}\n` +
        `Items: ${order.items.length} items\n` +
        `Total: $${order.total}\n\n` +
        `${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Tracking info will be provided once shipped.'}`;
      
      await queueMessage(psid, statusMessage);
      
    } catch (error) {
      await queueMessage(psid, '❌ Unable to retrieve order information. Please try again later.');
    }
  }
};
```

### Customer Support Bot

```typescript
const handleSupportMessage = async (psid: string, message: string) => {
  const lowerMessage = message.toLowerCase();
  
  // FAQ responses
  if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
    await queueMessage(psid, '🔄 Returns & Refunds\n\nYou can return items within 30 days. Visit our returns portal: https://example.com/returns');
    return;
  }
  
  if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
    await queueMessage(psid, '🚚 Shipping Info\n\n• Free shipping on orders $50+\n• 3-5 business days delivery\n• Express shipping available');
    return;
  }
  
  if (lowerMessage.includes('hours') || lowerMessage.includes('open')) {
    await queueMessage(psid, '🕐 Store Hours\n\nMon-Fri: 9am-8pm\nSat-Sun: 10am-6pm\nHoliday hours may vary');
    return;
  }
  
  // Forward to human agent
  await queueMessage(psid, '👋 Thanks for reaching out! A team member will respond shortly. For urgent matters, call (555) 123-4567.');
};
```

### Multi-Platform Messaging

```typescript
const sendToAllPlatforms = async (psid: string, message: string) => {
  try {
    // Send via Messenger
    await metaService.sendMessage({
      psid,
      text: message,
      accessToken: process.env.META_ACCESS_TOKEN!
    });
    
    // Also send via Instagram if account is linked
    if (process.env.INSTAGRAM_ACCOUNT_ID) {
      await metaService.sendMessage({
        psid,
        text: message,
        accessToken: process.env.META_ACCESS_TOKEN!,
        instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID
      });
    }
    
  } catch (error) {
    console.error('Failed to send multi-platform message:', error);
  }
};
```

## 📊 Error Handling Patterns

### Retry Logic

```typescript
const sendWithRetry = async (
  params: MetaSendMessageParams, 
  maxRetries: number = 3
): Promise<MetaMessageResponse> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await metaService.sendMessage(params);
    } catch (error) {
      lastError = error;
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
```

### Rate Limit Handling

```typescript
import { queueMessage } from './metaProcessor';

// The built-in queue automatically handles rate limiting
// by adding delays between messages

// For custom implementations:
class RateLimitedSender {
  private lastSent = 0;
  private minInterval = 1000; // 1 second between messages
  
  async sendMessage(params: MetaSendMessageParams) {
    const now = Date.now();
    const timeSinceLastSent = now - this.lastSent;
    
    if (timeSinceLastSent < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastSent)
      );
    }
    
    this.lastSent = Date.now();
    return await metaService.sendMessage(params);
  }
}
```

## 🔒 Security Best Practices

### Webhook Signature Verification

```typescript
import crypto from 'crypto';

const verifySignature = (payload: string, signature: string, secret: string): boolean => {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  
  return signature === `sha256=${digest}`;
};

// In your webhook handler
app.post('/webhook/meta', (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const payload = JSON.stringify(req.body);
  
  if (signature && !verifySignature(payload, signature, process.env.META_APP_SECRET!)) {
    return res.status(403).send('Forbidden');
  }
  
  // Process webhook...
});
```

## 🧪 Testing Patterns

### Mock Service for Testing

```typescript
class MockMetaService {
  async sendMessage(params: MetaSendMessageParams): Promise<MetaMessageResponse> {
    console.log('Mock: Sending message', params);
    
    return {
      recipient_id: params.psid,
      message_id: `mock_msg_${Date.now()}`
    };
  }
}

// Use in tests
const metaService = process.env.NODE_ENV === 'test' 
  ? new MockMetaService() 
  : require('./metaService').default;
```