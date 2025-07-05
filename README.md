# SlackConnect

A modern, secure Slack workspace integration application built with Next.js for sending and scheduling messages to Slack channels.

## Features

- 🔐 **Secure OAuth 2.0 Authentication** with Slack
- 💬 **Send Messages** to any channel in your Slack workspace
- ⏰ **Schedule Messages** for future delivery
- 📊 **Dashboard** with message management and analytics
- 📋 **Message History** - view sent and scheduled messages
- 🔄 **Automatic Token Refresh** - handles Slack token expiration
- 🎨 **Beautiful, Modern UI** with responsive design
- 📱 **Mobile-responsive** design
- ⚡ **Fast Performance** with Next.js 15

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd slackconnect
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Slack app credentials
   ```

4. **Configure your Slack app**
   - Follow the detailed setup guide in [SETUP.md](./SETUP.md)
   - Create a Slack app at [https://api.slack.com/apps](https://api.slack.com/apps)
   - Configure OAuth permissions and redirect URLs

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Custom JWT-based authentication with Slack OAuth
- **Database**: MongoDB with Mongoose
- **Job Scheduling**: Agenda.js for scheduled message delivery
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm

## Project Structure

```
slackconnect/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── messages/
│   │   │   │   ├── send/route.ts           # Send immediate/scheduled messages
│   │   │   │   ├── scheduled/route.ts      # Get/cancel scheduled messages
│   │   │   │   └── sent/route.ts           # Get sent message history
│   │   │   ├── session/route.ts            # Get current session
│   │   │   ├── signout/route.ts            # Sign out endpoint
│   │   │   └── slack/
│   │   │       ├── login/route.ts          # Slack OAuth login
│   │   │       ├── callback/route.ts       # Slack OAuth callback
│   │   │       ├── channels/route.ts       # Get Slack channels
│   │   │       └── user-info/route.ts      # Get user info
│   │   ├── dashboard/page.tsx              # Dashboard after login
│   │   ├── login/page.tsx                  # Login page
│   │   ├── layout.tsx                      # Root layout
│   │   └── page.tsx                        # Home page
│   ├── components/
│   │   ├── MessageSender.tsx               # Message composition component
│   │   ├── ScheduledMessagesList.tsx       # Scheduled messages display
│   │   ├── SentMessagesList.tsx            # Sent messages display
│   │   ├── BoxCard.tsx                     # Reusable card component
│   │   ├── StatBox.tsx                     # Statistics display component
│   │   └── HomePage.tsx                    # Landing page component
│   ├── lib/
│   │   ├── auth.ts                         # Authentication utilities
│   │   ├── session.ts                      # Session management
│   │   ├── useSession.ts                   # React hook for session
│   │   ├── slackTokenManager.ts            # Slack token management
│   │   ├── dbConnect.ts                    # Database connection
│   │   ├── mongoClient.ts                  # MongoDB client
│   │   ├── agenda.ts                       # Job scheduling setup
│   │   └── testTokenRefresh.ts             # Token refresh testing
│   ├── models/
│   │   ├── UserModel.ts                    # User schema
│   │   ├── MessageModel.ts                 # Message schema
│   │   ├── MessageDeliveryModel.ts         # Message delivery schema
│   │   └── index.ts                        # Model exports
│   └── worker/
│       ├── minimalAgendaWorker.ts          # Message 
├── public/                                 # Static assets
├── SETUP.md                                # Detailed setup guide
└── README.md                               # This file
```

## Environment Variables

Required environment variables (see [SETUP.md](./SETUP.md) for detailed instructions):

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# Slack OAuth Configuration
AUTH_SLACK_ID=your_slack_client_id
AUTH_SLACK_SECRET=your_slack_client_secret
AUTH_REDIRECT_URI=your_redirect_uri

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=your_base_url
NODE_ENV=development
```

## Features in Detail

### Message Management
- **Send Immediate Messages**: Send messages to any channel instantly
- **Schedule Messages**: Schedule messages for future delivery
- **Message History**: View all sent messages with timestamps
- **Cancel Scheduled Messages**: Cancel pending scheduled messages

### Authentication & Security
- **Slack OAuth 2.0**: Secure authentication through Slack
- **JWT Sessions**: Stateless session management
- **Token Refresh**: Automatic handling of Slack token expiration
- **Secure Cookies**: HttpOnly cookies for session storage

### Dashboard Features
- **Channel Selection**: Browse and select from available Slack channels
- **Message Composition**: Rich text input for message creation
- **Scheduling Interface**: Easy-to-use datetime picker for scheduling
- **Status Tracking**: Real-time status updates for message delivery

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Test token refresh (development)
npx ts-node src/lib/testTokenRefresh.ts
```

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **AWS Amplify**

Make sure to set all required environment variables in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For detailed setup instructions and troubleshooting, see [SETUP.md](./SETUP.md).

For issues and questions:
- Review the [Slack API documentation](https://api.slack.com/)
- Check the [Next.js documentation](https://nextjs.org/docs)
- Open an issue in this repository
