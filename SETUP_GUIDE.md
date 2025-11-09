# Meta App Setup Guide

This guide walks you through setting up a Meta (Facebook) app for Instagram and Facebook Messenger DM functionality.

## 🚀 Quick Setup Checklist

- [ ] Create Meta Developer App
- [ ] Configure App Permissions
- [ ] Get Page Access Token
- [ ] Setup Webhook URL
- [ ] Test Message Sending

## 📱 Step 1: Create Meta Developer App

1. **Go to Meta Developer Console**
   - Visit: https://developers.facebook.com/apps/
   - Click **"Create App"**

2. **Choose App Type**
   - Select **"Business"** (recommended for production)
   - Or **"Consumer"** for testing

3. **Fill App Details**
   - **App Name**: Your app name (e.g., "My Business Bot")
   - **Contact Email**: Your email address
   - Click **"Create App"**

4. **Note Your App Credentials**
   ```env
   META_APP_ID=your-app-id-here
   META_APP_SECRET=your-app-secret-here
   ```

## 🔧 Step 2: Configure App Products

### Add Messenger Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Messenger"** and click **"Set Up"**
3. Go to **Messenger → Settings**

### Add Instagram Product (Optional)

1. Click **"Add Product"** again  
2. Find **"Instagram Graph API"** and click **"Set Up"**

## 🔑 Step 3: Get Access Token

### Option A: Via Graph API Explorer (Recommended for Testing)

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click **"Generate Access Token"**
4. Select your Facebook Page
5. Grant required permissions:
   - `pages_manage_metadata`
   - `pages_read_user_content` 
   - `instagram_manage_messages` (for Instagram)
6. Copy the token:
   ```env
   META_PAGE_ACCESS_TOKEN=EAABs...your-token-here
   ```

### Option B: Via OAuth Flow (Production)

Use this URL structure (replace values):
```
https://graph.facebook.com/oauth/authorize?client_id=YOUR_APP_ID&redirect_uri=YOUR_CALLBACK_URL&scope=pages_manage_metadata,pages_read_user_content,instagram_manage_messages&response_type=code
```

## 🌐 Step 4: Setup Webhook (for Receiving Messages)

### For Local Development (using ngrok)

1. **Install ngrok**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok tunnel**
   ```bash
   ngrok http 3000
   ```
   
3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Configure Webhook in Meta Console

1. **Go to Messenger → Settings**
2. **Find Webhooks section**
3. **Click "Add Callback URL"**
4. **Fill the form:**
   - **Callback URL**: `https://your-domain.com/webhook/meta`
   - **Verify Token**: Choose any string (e.g., `my_voice_is_my_password_verify_me`)
   - **Subscription Fields**: Check `messages`
5. **Click "Verify and Save"**

### Update Environment Variables

```env
WEBHOOK_URL=https://your-domain.com/webhook/meta
VERIFY_TOKEN=my_voice_is_my_password_verify_me
```

## 🧪 Step 5: Test Your Setup

1. **Copy environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Test message sending**
   ```bash
   npm run test-dm
   ```

4. **Start webhook server**
   ```bash
   npm run dev
   ```

## 📋 Required Permissions

For full functionality, your access token needs:

| Permission | Purpose |
|------------|---------|
| `pages_manage_metadata` | Configure webhooks |
| `pages_read_user_content` | Read incoming messages |
| `instagram_manage_messages` | Send Instagram DMs |

## 🔍 Troubleshooting

### "Invalid Access Token" Error
- Generate a new token via Graph API Explorer
- Ensure token has required permissions
- Check token hasn't expired

### "Webhook Verification Failed"
- Verify your webhook URL is publicly accessible
- Check VERIFY_TOKEN matches exactly
- Ensure your server is running

### "Cannot Send Message" Error
- Verify recipient PSID is correct
- Check if recipient has messaged your page first
- Ensure page is published (not in development mode)

### Getting Recipient PSID
- User must send a message to your page first
- PSID will be in the webhook payload
- For testing, create a test user in Meta Console

## 🎯 Production Considerations

- **Use a real domain** instead of ngrok
- **Enable webhook security** (verify signatures)
- **Implement rate limiting** (Meta has API limits)
- **Add error handling** and retry logic
- **Store tokens securely** (encrypted database)

## 🔗 Useful Links

- [Meta Developer Console](https://developers.facebook.com/apps/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Messenger Platform Docs](https://developers.facebook.com/docs/messenger-platform/)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)