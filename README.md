# RANKEDterview Frontend

Modern Next.js 14 frontend for the RANKEDterview platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

The app will be available at http://localhost:3000

## 📁 Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── dashboard/     # Protected dashboard pages
│   ├── login/         # Authentication pages
│   └── page.tsx       # Landing page
├── components/        # React components
│   ├── ui/            # Reusable UI components
│   ├──auth/          # Auth-specific components
│   └── dashboard/     # Dashboard components
├── lib/               # Utilities and helpers
│   ├── api/           # API client and methods
│   ├── context/       # React contexts
│   └── hooks/         # Custom React hooks
└── types/             # TypeScript type definitions
```

## 🎨 Features

✅ **Modern UI** - Built with Tailwind CSS  
✅ **Type-Safe** - Full TypeScript support  
✅ **Real-Time** - WebSocket integration  
✅ **Responsive** - Mobile-first design  
✅ **Auth** - OAuth integration (Google, GitHub)  
✅ **State Management** - React Context API  

## 📖 Available Pages

- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - Main dashboard
- `/dashboard/matchmaking` - Find interview partners
- `/dashboard/interviews` - Interview history
- `/dashboard/leaderboard` - Rankings
- `/dashboard/profile` - User profile

## 🔧 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🛠️ Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📦 Key Dependencies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 🎯 API Integration

All API calls go through the centralized API client in `src/lib/api/`.

Example:
```typescript
import { userAPI, matchmakingAPI } from '@/lib/api';

// Get current user
const user = await userAPI.getCurrentUser();

// Join matchmaking queue
await matchmakingAPI.joinQueue();
```

## 🔐 Authentication

Uses JWT tokens stored in localStorage. Auto-refresh on expiration.

Protected routes use the `useProtectedRoute` hook.

## 🎨 UI Components

Reusable components in `src/components/ui/`:
- Button
- Card
- Modal
- (More as needed)

## 📱 Responsive Design

Mobile-first approach with breakpoints:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px

## 🚀 Deployment

```bash
# Build
npm run build

# The output will be in .next/

# Deploy to Vercel (recommended)
vercel

# Or deploy to any Node.js hosting
npm start
```

## 📄 License

MIT

---

**Built with ❤️ for RANKEDterview**
