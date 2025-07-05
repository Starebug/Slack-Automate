# SlackConnect

A modern, secure Slack workspace integration application built with Next.js and NextAuth.js.

## Features

- 🔐 **Secure OAuth 2.0 Authentication** with Slack
- 🎨 **Beautiful, Modern UI** with responsive design
- 📊 **Dashboard** with workspace analytics and management
- 🔄 **Real-time Session Management** with NextAuth.js
- 📱 **Mobile-responsive** design
- ⚡ **Fast Performance** with Next.js 15 and Turbopack

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
   cp .env.local.example .env.local
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
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Development**: Turbopack for fast builds

## Project Structure

```
slackconnect/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts  # NextAuth API routes
│   │   ├── dashboard/page.tsx               # Dashboard after login
│   │   ├── login/page.tsx                   # Login page
│   │   ├── layout.tsx                       # Root layout
│   │   └── page.tsx                         # Home page
│   ├── components/
│   │   └── SessionProvider.tsx              # NextAuth session provider
│   └── lib/
│       └── auth.ts                          # NextAuth configuration
├── public/                                  # Static assets
├── SETUP.md                                 # Detailed setup guide
└── README.md                                # This file
```

## Environment Variables

Required environment variables (see [SETUP.md](./SETUP.md) for detailed instructions):

```env
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/slack
```

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
- Check the [NextAuth.js documentation](https://next-auth.js.org/)
- Review the [Slack API documentation](https://api.slack.com/)
- Open an issue in this repository
