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

### Running the Worker Locally (for Scheduled Messages)

To test scheduled message functionality, you need to run the background worker:

1. **Start the worker in a separate terminal**
   ```bash
   # In a new terminal window/tab
   cd slackconnect
   pnpm run worker
   ```

2. **Verify worker is running**
   - You should see: `[Worker] Agenda ready!`
   - Health check available at: `http://localhost:3001`
   - Queue status logs every 30 seconds

3. **Test scheduled messages**
   - Schedule a message in the web app
   - Watch the worker logs for job processing
   - Messages will be sent at the scheduled time

**Note**: The worker must be running for scheduled messages to be delivered. In production, deploy the worker as a separate service.

### Running with ngrok (for external access)

If you need to test the app from external devices or share it with others, you can use ngrok:

1. **Install ngrok** (if not already installed)
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com/
   ```

2. **Start your Next.js app**
   ```bash
   pnpm dev
   ```

3. **Start ngrok tunnel**
   ```bash
   ngrok http 3000
   ```

4. **Update your environment variables**
   ```env
   NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
   AUTH_REDIRECT_URI=https://your-ngrok-url.ngrok.io/api/slack/callback
   ```

5. **Update your Slack app settings**
   - Go to your Slack app settings at [https://api.slack.com/apps](https://api.slack.com/apps)
   - Navigate to **OAuth & Permissions**
   - Add the ngrok URL to **Redirect URLs**: `https://your-ngrok-url.ngrok.io/api/slack/callback`
   - Save the changes

6. **Access your app**
   Navigate to your ngrok URL: `https://your-ngrok-url.ngrok.io`

**Note**: ngrok URLs change each time you restart ngrok (unless you have a paid account). You'll need to update both your environment variables and Slack app settings with the new URL.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Custom JWT-based authentication with Slack OAuth
- **Database**: MongoDB with Mongoose
- **Job Scheduling**: Agenda.js for scheduled message delivery
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm

## Architectural Overview

### OAuth Flow & Token Management
The application implements a secure OAuth 2.0 flow with Slack:

1. **OAuth Initiation**: Users click "Connect with Slack" → redirects to Slack's authorization page
2. **Scope Request**: Requests `users:read.email`, `channels:read`, `chat:write`, and other necessary permissions
3. **Token Exchange**: Receives both user and bot tokens from Slack's OAuth callback
4. **Token Storage**: Securely stores tokens in MongoDB with automatic refresh handling
5. **Session Management**: Uses JWT tokens for stateless session management with secure HttpOnly cookies

### Scheduled Task Handling
The system uses a robust background job processing architecture:

1. **Job Creation**: When users schedule messages, jobs are created in MongoDB's `agendaJobs` collection
2. **Worker Process**: Dedicated worker service processes jobs using Agenda.js with automatic retry logic
3. **Timezone Handling**: Proper UTC/IST conversion ensures accurate delivery timing
4. **Cleanup Strategy**: Successful jobs are cleaned up immediately, failed jobs after max retries
5. **Monitoring**: Real-time queue status monitoring with detailed logging

### Database Design
- **Users**: Store Slack user info, tokens, and team details
- **Messages**: Store message content and metadata
- **MessageDeliveries**: Track delivery status, attempts, and scheduling info
- **AgendaJobs**: Background job queue for scheduled processing

## Challenges & Learnings

### 1. Timezone Management & UTC/Local Time Confusion
**Challenge**: As a newcomer to timezone handling, initially struggled with the complexity of UTC vs local time (IST) conversion. The datetime-local input was being interpreted incorrectly, causing messages to be scheduled for wrong times.

**Initial Problems**:
- Datetime-local input was being treated as UTC instead of local time
- Messages were being scheduled 5:30 hours ahead of intended time
- Frontend was displaying UTC times as if they were IST
- Worker logs showed confusing timestamps

**Solution**: Implemented proper timezone conversion:
- Frontend datetime-local input interpreted as IST
- Backend converts IST to UTC for storage: `new Date(istTime - 5.5 hours)`
- Worker processes in UTC, ensuring accurate delivery
- Frontend displays in IST for user-friendly experience

**Learning**: Always store times in UTC, convert for display, and be explicit about timezone handling. The datetime-local input provides local time, not UTC time.

### 2. Initial Setup & Connection Challenges
**Challenge**: As a newcomer to Slack API and OAuth integration, faced significant hurdles in understanding the authentication flow and setting up the initial connection.

**Initial Problems**:
- Unfamiliar with Slack OAuth 2.0 flow and required scopes
- Confused about the difference between user tokens and bot tokens
- Struggled with redirect URI configuration and ngrok setup
- Didn't understand the importance of `users:read.email` scope for accessing email addresses
- Made mistakes in environment variable configuration

**Solution**: 
- Studied Slack API documentation thoroughly
- Implemented step-by-step OAuth flow with proper error handling
- Added comprehensive logging to debug authentication issues
- Created detailed setup guide for future reference
- Used ngrok for local development and testing

**Learning**: OAuth integration requires understanding of scopes, tokens, and proper error handling. Always read documentation carefully and test each step.

### 3. Background Job Processing
**Challenge**: Implementing reliable scheduled message delivery that survives server restarts and handles failures gracefully.

**Solution**: 
- Used Agenda.js with MongoDB persistence for job durability
- Implemented comprehensive retry logic (3 attempts with exponential backoff)
- Added automatic cleanup for both successful and failed jobs
- Created separate worker service for production deployment

**Learning**: Background job systems need persistence, monitoring, and cleanup strategies.

### 4. Token Refresh & Security
**Challenge**: Managing Slack token expiration and ensuring secure token storage.

**Solution**:
- Implemented automatic token refresh using refresh tokens
- Stored tokens securely in MongoDB with encryption
- Added token validation before API calls
- Graceful handling of expired tokens with user re-authentication prompts

**Learning**: OAuth token management requires proactive refresh and graceful degradation.

### 5. Production Deployment Architecture
**Challenge**: Deploying a system with both web app and background worker requirements.

**Solution**:
- Separated web app (Next.js) and worker (Agenda.js) into different services
- Used platform-specific deployment strategies (Vercel for web, Railway/Render for worker)
- Implemented health checks and graceful shutdown handling
- Added comprehensive logging for debugging production issues

**Learning**: Microservices architecture provides better scalability and deployment flexibility.

### 6. Error Handling & User Experience
**Challenge**: Providing clear feedback for various failure scenarios (network issues, permission errors, etc.).

**Solution**:
- Implemented specific error messages for different Slack API errors
- Added retry mechanisms with user-friendly messaging
- Created comprehensive logging for debugging
- Built responsive UI with loading states and error recovery

**Learning**: Good error handling improves user experience and reduces support burden.

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
AUTH_REDIRECT_URI=your_base_url/api/slack/callback

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=your_base_url
NODE_ENV=development
```

**Important**: The `AUTH_REDIRECT_URI` must be in the format `{NEXT_PUBLIC_BASE_URL}/api/slack/callback`. For example:
- Development: `http://localhost:3000/api/slack/callback`
- Production: `https://yourdomain.com/api/slack/callback`

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
