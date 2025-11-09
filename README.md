# Meta DM Package - Instagram & Facebook Messaging

This package contains the core functionality for sending and receiving direct messages on Instagram and Facebook Messenger via Meta's Graph API.

## 📋 What's Included

### Core Files
- `metaService.ts` - Main service for sending messages via Graph API
- `webhookController.ts` - Handles incoming webhook events from Meta
- `metaProcessor.ts` - Queue processor for reliable message sending
- `send-meta-dm.ts` - Simple script for testing message sending
- `types.ts` - TypeScript interfaces and types

### Documentation
- `SETUP_GUIDE.md` - Complete Meta app setup instructions
- `WEBHOOK_SETUP.md` - Webhook configuration guide
- `API_EXAMPLES.md` - Code examples and usage patterns

### Configuration
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Meta app credentials
   ```

3. **Test Message Sending**
   ```bash
   npm run test-dm
   ```

## 🔧 Key Features

- **Unified API**: Send messages to both Instagram and Facebook Messenger
- **Webhook Handler**: Receive and process incoming messages
- **Queue System**: Reliable message delivery with retry logic
- **TypeScript**: Full type safety and intellisense
- **Error Handling**: Comprehensive error logging and handling
- **Production Ready**: Includes authentication and security measures

## 📱 Supported Platforms

- Facebook Messenger (via Facebook Graph API)
- Instagram Direct Messages (via Instagram Graph API)
- WhatsApp Business (Meta Graph API - not included in this package)

## 🔐 Authentication

This package uses Meta's OAuth 2.0 flow to obtain access tokens with the following permissions:
- `pages_manage_metadata` - Configure webhooks
- `pages_read_user_content` - Read incoming messages
- `instagram_manage_messages` - Send Instagram DMs

## 📚 Documentation

See the included documentation files for detailed setup and usage instructions:
- Setup your Meta app and get access tokens
- Configure webhooks for real-time message receiving
- Implement the messaging service in your application

## ⚠️ Important Notes

- This code is extracted from the AutoBlaze project
- Requires a valid Meta Developer App with appropriate permissions
- Webhook URLs must be publicly accessible (use ngrok for local development)
- Rate limits apply to Meta Graph API calls

## 🤝 Support

This package is provided as-is for your Meta app development project. The code has been tested and is production-ready when properly configured with valid Meta app credentials.