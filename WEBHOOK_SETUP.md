# Webhook Configuration Guide

This guide covers setting up webhooks to receive messages from Instagram and Facebook Messenger in real-time.

## 🎯 What Are Webhooks?

Webhooks allow Meta to send your application real-time notifications when:
- Users send messages to your Facebook Page
- Users send direct messages to your Instagram Business account  
- Other events occur (message reads, postbacks, etc.)

## 🌐 Webhook Requirements

### Public URL Required
Your webhook endpoint must be:
- **Publicly accessible** (not localhost)
- **HTTPS only** (SSL/TLS certificate required)
- **Responds within 20 seconds**
- **Returns HTTP 200** status for all requests

### For Local Development: Use ngrok

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Start your local server
npm run dev  # Starts on port 3000

# In another terminal, create public tunnel
ngrok http 3000

# Output will show:
# Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

## ⚙️ Configuration Steps

### Step 1: Configure in Meta Developer Console

1. **Go to your Meta App**: https://developers.facebook.com/apps/YOUR_APP_ID
2. **Navigate to Messenger**: Products → Messenger → Settings
3. **Find Webhooks section**
4. **Click "Add Callback URL"**

### Step 2: Fill Webhook Configuration

```
Callback URL: https://your-domain.com/webhook/meta
Verify Token: my_voice_is_my_password_verify_me
```

**Subscription Fields** (check these):
- ✅ `messages` - Required for receiving messages
- ✅ `messaging_postbacks` - Optional, for button interactions
- ✅ `messaging_optins` - Optional, for opt-in events

### Step 3: Verify & Save

Click **"Verify and Save"**. Meta will send a GET request to verify your endpoint.

### Step 4: Subscribe Your Page

After verification:
1. Find your webhook in the list
2. Click **"Subscribe"** 
3. Select your Facebook Page
4. Grant permissions when prompted

## 🔧 Code Implementation

### Basic Express.js Setup

```typescript
import express from 'express';
import { setupWebhookRoutes } from './webhookController';

const app = express();
app.use(express.json());

// Automatic setup (recommended)
setupWebhookRoutes(app, async (psid, message, platform) => {
  console.log(`Message from ${psid} on ${platform}: ${message}`);
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

### Manual Route Setup

```typescript
import { verifyWebhook, receiveWebhook } from './webhookController';

// Webhook verification (GET request)
app.get('/webhook/meta', verifyWebhook);
app.get('/webhook/meta/:merchantId', verifyWebhook);

// Webhook events (POST request)
app.post('/webhook/meta', (req, res) => {
  receiveWebhook(req, res, async (psid, message, platform) => {
    // Your message handling logic
  });
});

app.post('/webhook/meta/:merchantId', (req, res) => {
  receiveWebhook(req, res, async (psid, message, platform) => {
    // Your message handling logic with merchant ID
    const merchantId = req.params.merchantId;
  });
});
```

## 📋 Webhook Payload Examples

### Facebook Messenger Payload

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1458692752478,
      "messaging": [
        {
          "sender": {
            "id": "USER_PSID"
          },
          "recipient": {
            "id": "PAGE_ID"
          },
          "timestamp": 1458692752478,
          "message": {
            "mid": "mid.1458692752478:af9dc6dd8b",
            "text": "Hello World!"
          }
        }
      ]
    }
  ]
}
```

### Instagram DM Payload

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "INSTAGRAM_BUSINESS_ACCOUNT_ID",
      "time": 1458692752478,
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": {
                  "id": "USER_INSTAGRAM_SCOPED_ID",
                  "username": "user.name"
                },
                "id": "MESSAGE_ID",
                "created_time": "2023-01-01T00:00:00+0000",
                "text": "Hello from Instagram!"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## 🧪 Testing Your Webhook

### 1. Test Verification Endpoint

```bash
# Test the GET endpoint (webhook verification)
curl "https://your-domain.com/webhook/meta?hub.mode=subscribe&hub.verify_token=my_voice_is_my_password_verify_me&hub.challenge=test123"

# Expected response: test123
```

### 2. Test Message Handling

```bash
# Test the POST endpoint (simulate incoming message)
curl -X POST https://your-domain.com/webhook/meta \
  -H "Content-Type: application/json" \
  -d '{
    "object": "page",
    "entry": [{
      "messaging": [{
        "sender": {"id": "test-psid"},
        "message": {"text": "test message"}
      }]
    }]
  }'

# Should return HTTP 200
```

### 3. Check Server Logs

Your server should log:
```
[INFO] Webhook verification attempt { mode: 'subscribe', token: 'my_voice_is_my_password_verify_me' }
[INFO] Webhook verified successfully
[INFO] Messenger message received { psid: 'test-psid', messagePreview: 'test message' }
```

## 🚨 Troubleshooting

### "Callback URL couldn't be validated"

**Possible causes:**
1. **Server not running**
   ```bash
   # Check if your server is running
   curl http://localhost:3000/webhook/meta
   ```

2. **ngrok not running** (for local dev)
   ```bash
   # Check ngrok status
   curl http://localhost:4040/api/tunnels
   # Or visit http://localhost:4040 in browser
   ```

3. **Wrong verify token**
   - Check your `.env` file: `VERIFY_TOKEN=my_voice_is_my_password_verify_me`
   - Must match exactly what you entered in Meta Console

4. **HTTPS required**
   - Use ngrok HTTPS URL: `https://abc123.ngrok.io`
   - Don't use HTTP URL in production

### "Webhook events not received"

**Check these:**
1. **Subscription active**
   - Go to Meta Console → Messenger → Webhooks
   - Verify your page is subscribed

2. **Page published**
   - Go to your Facebook Page settings
   - Ensure page is published (not in draft mode)

3. **Message source**
   - Test by sending message TO your page (not from it)
   - User must initiate conversation first

4. **Field subscriptions**
   - Verify `messages` field is checked in webhook settings

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Invalid verify token" | Check `VERIFY_TOKEN` in `.env` matches Meta Console |
| "URL not reachable" | Ensure server is running and publicly accessible |
| "SSL certificate error" | Use valid HTTPS URL (ngrok provides this) |
| "Timeout" | Webhook must respond within 20 seconds |

## 🔒 Security Best Practices

### 1. Verify Request Signatures (Production)

```typescript
import crypto from 'crypto';

const verifyWebhookSignature = (payload: string, signature: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.META_APP_SECRET!)
    .update(payload)
    .digest('hex');
    
  return signature === `sha256=${expectedSignature}`;
};

app.post('/webhook/meta', (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  if (!verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(403).send('Forbidden');
  }
  
  // Process webhook...
});
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many webhook requests',
});

app.use('/webhook', webhookLimiter);
```

### 3. Request Validation

```typescript
const validateWebhookRequest = (req: Request, res: Response, next: NextFunction) => {
  // Verify required headers
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).send('Invalid content type');
  }
  
  // Verify payload structure
  if (!req.body.object || !req.body.entry) {
    return res.status(400).send('Invalid payload structure');
  }
  
  next();
};

app.use('/webhook/meta', validateWebhookRequest);
```

## 📊 Monitoring & Debugging

### Webhook Logs Dashboard

Create a simple dashboard to monitor webhook activity:

```typescript
let webhookStats = {
  totalReceived: 0,
  lastReceived: null,
  errors: 0,
  platforms: { messenger: 0, instagram: 0 }
};

app.get('/webhook/stats', (req, res) => {
  res.json(webhookStats);
});

// In your message handler:
webhookStats.totalReceived++;
webhookStats.lastReceived = new Date().toISOString();
webhookStats.platforms[platform]++;
```

### Debug Mode

```typescript
const DEBUG_MODE = process.env.NODE_ENV === 'development';

const handleMessage = async (psid: string, message: string, platform: string) => {
  if (DEBUG_MODE) {
    console.log('🐛 DEBUG: Webhook payload:', {
      psid,
      message,
      platform,
      timestamp: new Date().toISOString()
    });
  }
  
  // Your message handling logic...
};
```

## 🚀 Production Deployment

### Environment Variables

```env
# Production webhook URL
WEBHOOK_URL=https://yourdomain.com/webhook/meta

# Security
META_APP_SECRET=your-app-secret
VERIFY_TOKEN=your-secure-verify-token

# Monitoring
LOG_LEVEL=info
WEBHOOK_TIMEOUT=15000
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

### Health Check Endpoint

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

This webhook setup ensures reliable message receiving from both Instagram and Facebook Messenger platforms.