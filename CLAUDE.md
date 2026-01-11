# Trackr Frontend Mobile - Technical Documentation

## Overview

React Native mobile application built with Expo for the Trackr application (book tracker).

**Link to global project**: See [../CLAUDE.md](../CLAUDE.md)

## Tech Stack

- **Framework**: Expo SDK 54.0.9
- **React**: 19.1.0
- **React Native**: 0.81.4
- **Navigation**: Expo Router 6.0.7 + React Navigation 7
- **State Management**:
  - Zustand 5.0.4 (global state)
  - TanStack Query 5.89.0 (server state/cache)
- **UI/Styling**:
  - React Native Skia 2.2.12
  - Expo UI 0.2.0-beta.9
  - Lucide React Native (icons)
- **AI**: AI SDK React 2.0.76
- **HTTP Client**: Axios 1.8.4
- **i18n**: i18next 25.5.2 + react-i18next 16.0.0
- **Charts**: Victory Native 41.20.2
- **Animations**: React Native Reanimated 4.1.0
- **Payments**: RevenueCat (react-native-purchases 9.6.8)
- **Gestures**: React Native Gesture Handler 2.28.0

## Project Structure

```
trackr-front-mobile/
├── app/                           # File-based routing (Expo Router)
│   ├── (tabs)/                    # Tab navigation
│   │   ├── index.tsx             # Home / Feed
│   │   ├── discover/             # Book discovery
│   │   ├── collection/           # User library
│   │   └── me/                   # User profile
│   │
│   ├── (zShared)/                # Shared/modal screens
│   │   ├── book/                 # Book details
│   │   ├── chat/                 # AI chat
│   │   ├── list/                 # Reading lists
│   │   ├── activity/             # Activity
│   │   ├── profile/              # Public profile
│   │   ├── settings.tsx          # Settings
│   │   ├── stats.tsx             # Statistics
│   │   ├── subscription.tsx      # Trackr+ subscription
│   │   ├── paywall.tsx           # Paywall
│   │   └── ...
│   │
│   ├── auth/                     # Authentication
│   ├── category-full.tsx         # Full category view
│   └── _layout.tsx               # Root layout
│
├── components/                    # Reusable components
│   ├── ai-agents/                # AI components
│   ├── book/                     # Book components
│   ├── book-actions/             # Book actions
│   ├── chat/                     # Chat components
│   ├── collection/               # Collection components
│   ├── discover/                 # Discovery components
│   ├── home/                     # Home components
│   ├── reviews/                  # Review components
│   ├── shared/                   # Shared components
│   ├── stats/                    # Statistics components
│   ├── ui/                       # Base UI components
│   ├── skeleton-loader/          # Loaders
│   ├── BookCard.tsx
│   ├── BookListElement.tsx
│   ├── CategorySlider.tsx
│   ├── TabBar.tsx
│   └── ...
│
├── hooks/                        # Custom hooks
│   ├── queries/                  # TanStack Query hooks
│   │   ├── books.ts
│   │   ├── categories.ts
│   │   ├── lists.ts
│   │   ├── reviews.ts
│   │   ├── search.ts
│   │   ├── users.ts
│   │   ├── reports.ts
│   │   └── keys.ts              # Query keys
│   ├── useDebouncedValue.ts
│   ├── useLocalization.ts
│   ├── useTrackrPlus.ts
│   └── useTypography.ts
│
├── stores/                       # Zustand stores
│   ├── trackedBookStore.ts      # Tracked books state
│   ├── userStore.ts             # User state
│   └── uiStore.ts               # UI state (theme, etc.)
│
├── constants/                    # Constants
├── utils/                        # Utility functions
├── types/                        # TypeScript types
└── assets/                       # Images, fonts, etc.
```

## Navigation Architecture

### File-based Routing (Expo Router)

The application uses Expo Router v6 file-based routing:

```
app/
├── _layout.tsx                   # Root layout (providers)
├── (tabs)/                       # Tab navigation
│   ├── _layout.tsx              # Tab bar layout
│   ├── index.tsx                # "Home" tab (/)
│   ├── discover/                # "Discover" tab (/discover)
│   ├── collection/              # "Collection" tab (/collection)
│   └── me/                      # "Me" tab (/me)
├── (zShared)/                    # Modal/Shared screens
│   └── book/[id].tsx            # /book/:id (modal)
└── auth/                        # Auth screens
    ├── login.tsx                # /auth/login
    └── register.tsx             # /auth/register
```

### Navigation Between Screens

```typescript
import { router } from 'expo-router';

// Simple navigation
router.push('/book/123');

// Navigation with params
router.push({
  pathname: '/book/[id]',
  params: { id: '123' }
});

// Go back
router.back();

// Replace
router.replace('/home');
```

## State Management

### Zustand (Global State)

#### userStore
```typescript
// stores/userStore.ts
interface UserStore {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}
```

#### trackedBookStore
```typescript
// Tracked books in library state
interface TrackedBookStore {
  trackedBooks: TrackedBook[];
  addBook: (book: TrackedBook) => void;
  removeBook: (id: string) => void;
  updateBook: (id: string, data: Partial<TrackedBook>) => void;
}
```

#### uiStore
```typescript
// UI state (theme, language, etc.)
interface UIStore {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  setTheme: (theme: string) => void;
  setLanguage: (lang: string) => void;
}
```

### TanStack Query (Server State)

All API calls use TanStack Query for caching, synchronization, and loading state management.

#### Query Hooks

```typescript
// hooks/queries/books.ts
export const useBooks = (filters?: BookFilters) => {
  return useQuery({
    queryKey: ['books', filters],
    queryFn: () => fetchBooks(filters)
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => fetchBook(id)
  });
};

export const useTrackBook = () => {
  return useMutation({
    mutationFn: (data: TrackBookData) => trackBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['library']);
    }
  });
};
```

#### Query Keys
```typescript
// hooks/queries/keys.ts
export const queryKeys = {
  books: ['books'],
  book: (id: string) => ['book', id],
  library: ['library'],
  reviews: ['reviews'],
  categories: ['categories'],
  // ...
};
```

## API Management

### Axios Configuration

```typescript
import axios from 'axios';
import { userStore } from '@/stores/userStore';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptor to add token
api.interceptors.request.use((config) => {
  const token = userStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      userStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
```

## Main Components

### BookCard
Card displaying a book (cover, title, author, rating)

### BookListElement
List element for books (horizontal layout)

### CategorySlider
Horizontal category slider

### TrackingIconButton
Button to add/modify book tracking

### TabBar
Custom navigation bar

### BottomSheets
- `CreateListBottomSheet`: Create a list
- `ListActionsBottomSheet`: List actions
- `ReportBottomSheet`: Report content
- `SortBottomSheet`: Sort options

## Main Features

### Authentication
- Login/Register
- Google OAuth (via expo-web-browser)
- Forgot password
- Token management (expo-secure-store)

### Library
- Display tracked books
- Filter by status (reading, completed, planned, etc.)
- Sort (date, rating, title, etc.)
- Grid/list layout

### Discovery
- Book search
- Recommendations
- Categories
- Trending

### Books
- Book details
- Tracking (status, progress, dates)
- Reviews and ratings
- Add to lists
- Share

### AI Chat
- AI conversation (AI SDK)
- Personalized recommendations
- Book questions

### Statistics
- Reading charts (Victory Native)
- Goals
- Personal trends

### Subscription (Trackr Plus)
- RevenueCat for payments
- Paywall
- Subscription management

### i18n
- Multilingual support (French, English)
- Language selector
- Translations via i18next

## Theme and Styling

### Theme Management
```typescript
// uiStore manages theme (light/dark/auto)
const theme = useUIStore((state) => state.theme);
```

### Colors
Defined in `constants/Colors.ts` for light/dark mode
Don't use colors.primary (deprecated), use colors.accent instead.

### Typography
Custom hook `useTypography` for text styles

## Animations

### React Native Reanimated
```typescript
import Animated, {
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(scale.value) }]
}));
```

### Gestures
```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const panGesture = Gesture.Pan()
  .onUpdate((e) => {
    // handle pan
  });
```

## Optimizations

### Images
- Using `expo-image` (optimized)
- Lazy loading
- Placeholder and blurhash

### Lists
- `FlashList` for long lists (@shopify/flash-list)
- Virtualization
- Pagination

### Queries
- Configured stale time
- Cache time
- Prefetching

## Scripts

```bash
# Start dev server
npm start

# Android
npm run android

# iOS
npm run ios

# Web
npm run web

# Tests
npm test

# Linting
npm run lint

# Reset project
npm run reset-project
```

## Environment Variables

Create a `.env` file at the root:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=
```

Access in code:
```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

## Build and Deployment

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios

# Build both
eas build --platform all
```

### OTA Updates

```bash
# Publish update
eas update --auto
```

## Testing

### Jest + React Test Renderer

```bash
npm test
```

Configuration in `package.json`:
```json
{
  "jest": {
    "preset": "jest-expo"
  }
}
```

## Best Practices

### Components
- Functional components with hooks
- Typed props with TypeScript
- Memoization (`React.memo`) for heavy components
- Custom hooks for reusable logic

### State
- Zustand for simple global state
- TanStack Query for server state
- useState/useReducer for local state

### Performance
- Avoid unnecessary re-renders
- Lazy load screens
- Optimistic updates with TanStack Query
- Debounce for searches

### Accessibility
- Accessible labels (`accessibilityLabel`)
- Roles (`accessibilityRole`)
- Screen reader support

## Troubleshooting

### Metro bundler won't start
```bash
npx expo start -c
```

### Cache problems
```bash
rm -rf node_modules
rm -rf .expo
npm install
npx expo start -c
```

### Build errors
```bash
npx expo prebuild --clean
```

## Resources

- [Expo Docs](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
- [AI SDK](https://sdk.vercel.ai/docs)
- [Global Project Documentation](../CLAUDE.md)
- [Backend API](../trackr-backend/CLAUDE.md)

---

**To contribute to the frontend, follow React Native conventions and ensure linting passes before committing.**
