# AI Coding Agent Instructions for Link Bloom

## Architecture Overview

**Link Bloom** is a role-based marketplace connecting clients with service providers, built with React + TypeScript + Vite. The app has three distinct user roles with separate routing trees:

- **CLIENT**: Browse and book services ([src/pages/client](src/pages/client))
- **PROVIDER**: Manage services, bookings, and availability ([src/pages/provider](src/pages/provider))
- **ADMIN**: Oversee users, verifications, and payouts ([src/pages/admin](src/pages/admin))

Each role has its own layout component with bottom navigation, and routing is protected by role-based authentication (see [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)).

## Critical Development Context

### Authentication Pattern (Firebase Migration in Progress)

The auth system uses **localStorage as a temporary mock** while Firebase integration is incomplete. Key files:

- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Contains TODO comments marking Firebase migration points
- [src/lib/firebase.ts](src/lib/firebase.ts) - Pre-configured but not yet integrated with auth flows
- Environment variables required: `.env.local` must contain all `VITE_FIREBASE_*` keys (see `.env.example`)

**When working with auth:** Always check for TODO comments indicating mock implementations that need Firebase replacements.

### Role-Based Routing System

Root route (`/`) uses `RoleBasedRedirect` component ([src/App.tsx](src/App.tsx)) which:

1. Redirects unauthenticated users to landing page
2. Routes authenticated users to `/client`, `/provider`, or `/admin` based on their role
3. Falls back to `/onboarding` if user has no role assigned

**Protected routes** wrap layouts and check `allowedRoles` array. Unauthorized users are redirected to their role's default path.

### Internationalization (i18n)

The app defaults to **Arabic (RTL)** with English support:

- i18n setup: [src/i18n/index.ts](src/i18n/index.ts)
- Auto-detects language from localStorage → navigator
- **Automatically switches document direction** (`dir="rtl"` or `ltr`) on language change
- Translation files: [src/i18n/locales/ar.json](src/i18n/locales/ar.json), [src/i18n/locales/en.json](src/i18n/locales/en.json)

**When adding UI strings:** Always add entries to both `ar.json` and `en.json` with proper translations.

## Project-Specific Conventions

### TypeScript Configuration

- **Relaxed type checking enabled** (see [tsconfig.json](tsconfig.json)):
  - `noImplicitAny: false`
  - `strictNullChecks: false`
  - `noUnusedLocals: false`

**Code style:** Match this permissive approach; explicit type annotations are optional.

### Import Aliases

- Use `@/` for all imports from `src/` directory
- Example: `import { Button } from "@/components/ui/button"`

### Component Organization

- **UI components**: [src/components/ui](src/components/ui) - shadcn/ui primitives (do not modify manually)
- **Layouts**: [src/components/layout](src/components/layout) - Role-specific layouts with bottom nav
- **Utilities**: [src/lib/utils.ts](src/lib/utils.ts) - Contains `cn()` for className merging with Tailwind

### Data Types

All type definitions centralized in [src/types/index.ts](src/types/index.ts):

- User roles: `'CLIENT' | 'PROVIDER' | 'ADMIN'`
- Booking statuses: 10+ states including `PENDING`, `COMPLETED`, `DISPUTED`, etc.
- Location types: `'AT_PROVIDER' | 'AT_CLIENT' | 'BOTH'`

**When adding features:** Check existing types first; many domain concepts already have definitions.

## Development Workflow

### Running the App

```bash
npm run dev          # Dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Dev mode build
npm run preview      # Preview production build
```

### Testing

```bash
npm test            # Run tests once
npm run test:watch  # Watch mode
```

- Test setup: [src/test/setup.ts](src/test/setup.ts)
- Config: [vitest.config.ts](vitest.config.ts)
- Uses jsdom environment with React Testing Library

### Linting

```bash
npm run lint        # ESLint with React hooks + TypeScript rules
```

## Integration Points

### State Management

- **React Query** (`@tanstack/react-query`) set up in [src/App.tsx](src/App.tsx) but not yet used
- **No global state library** - Auth context is the only cross-component state

### UI Framework

- **shadcn/ui + Radix UI** for components
- **Tailwind CSS** for styling with custom animations (`tailwindcss-animate`)
- **Framer Motion** available for advanced animations
- Use `cn()` utility from [src/lib/utils.ts](src/lib/utils.ts) for conditional classes

### Form Handling

- **react-hook-form + zod** available but no examples yet in codebase
- Pattern to follow: Import from `@hookform/resolvers/zod`

## Key Patterns to Follow

### Page Structure

All pages use this pattern:

```tsx
const MyPage = () => {
  const { user } = useAuth();
  return <div className="container mx-auto p-4">{/* Page content */}</div>;
};
```

### Layout Composition

Layouts use `<Outlet />` from react-router-dom:

```tsx
export const RoleLayout = () => (
  <div className="min-h-screen bg-background pb-20">
    <main>
      <Outlet />
    </main>
    <RoleBottomNav />
  </div>
);
```

### Protected Route Usage

```tsx
<Route path="/client" element={
  <ProtectedRoute allowedRoles={['CLIENT']}>
    <ClientLayout />
  </ProtectedRoute>
}>
```

## Common Pitfalls

1. **Don't forget i18n**: New UI strings must exist in both language files
2. **Check auth TODOs**: Mock auth won't persist across refreshes properly
3. **Role-based navigation**: Always test redirects for all three roles
4. **RTL support**: Test UI with Arabic (RTL) layout, especially forms and navigation
5. **Import paths**: Always use `@/` prefix, never relative paths from src/

---

## Implementation Tasks (What's Missing)

This section tracks what needs to be built to make the app production-ready. Work through tasks in order as many have dependencies.

### Phase 1: Core Infrastructure

#### Task 1.1: Firebase Authentication Integration

**Status:** 🔴 Not Started  
**Files:** [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx), [src/lib/firebase.ts](src/lib/firebase.ts)  
**What to do:**

- Replace localStorage mock with Firebase Auth in `AuthContext.tsx`
- Implement `onAuthStateChanged` listener for session persistence
- Replace mock `login()`, `signup()`, `logout()` with Firebase methods
- Store user role in Firestore `users/{uid}` document
- Update `.env.local` with real Firebase credentials

#### Task 1.2: Firestore Database Setup

**Status:** 🔴 Not Started  
**Files:** Create `src/lib/firestore.ts`  
**What to do:**

- Create Firestore collections: `users`, `providers`, `services`, `categories`, `bookings`, `chats`, `messages`, `reviews`, `payouts`
- Create helper functions for CRUD operations
- Set up Firestore security rules for role-based access
- Types already defined in [src/types/index.ts](src/types/index.ts)

#### Task 1.3: React Query Data Fetching Layer

**Status:** 🔴 Not Started  
**Files:** Create `src/hooks/queries/` directory  
**What to do:**

- QueryClient is configured in [src/App.tsx](src/App.tsx) but unused
- Create query hooks: `useServices`, `useProviders`, `useBookings`, `useCategories`
- Create mutation hooks: `useCreateBooking`, `useUpdateBookingStatus`, etc.
- Pattern: `src/hooks/queries/useServices.ts`

---

### Phase 2: Client Features

#### Task 2.1: Service Search & Discovery

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** [src/pages/placeholders.tsx](src/pages/placeholders.tsx) → Create `src/pages/client/ClientSearchPage.tsx`  
**What to do:**

- Replace `ClientSearchPage` placeholder with real implementation
- Search by category, location, keyword
- Filter by price range, rating, location type
- Display service cards with provider info
- Mock categories exist in [src/pages/client/ClientHomePage.tsx](src/pages/client/ClientHomePage.tsx)

#### Task 2.2: Provider Profile View

**Status:** 🔴 Not Started  
**Files:** Create `src/pages/client/ProviderProfilePage.tsx`  
**What to do:**

- Add route `/client/provider/:id` in [src/App.tsx](src/App.tsx)
- Display provider info, services, reviews, availability
- "Book Now" and "Message" CTAs
- Types: `ProviderProfile`, `Service`, `Review` in [src/types/index.ts](src/types/index.ts)

#### Task 2.3: Booking Flow

**Status:** 🔴 Not Started  
**Files:** Create `src/pages/client/BookingPage.tsx`  
**What to do:**

- Multi-step booking: Select service → Date/Time → Confirm → Pay
- Show available time slots (uses `AvailabilityRule` type)
- Create `Booking` record with status `PENDING`
- Translation keys ready in `booking.*` namespace

#### Task 2.4: Client Bookings Management

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** [src/pages/placeholders.tsx](src/pages/placeholders.tsx) → Create `src/pages/client/ClientBookingsPage.tsx`  
**What to do:**

- List client's bookings grouped by status
- Show upcoming, past, cancelled tabs
- Allow booking cancellation
- 10+ booking statuses defined in [src/types/index.ts](src/types/index.ts)

#### Task 2.5: Real-time Chat

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/client/ClientChatsPage.tsx`, `src/pages/client/ChatRoomPage.tsx`  
**What to do:**

- List conversations with providers
- Real-time messaging using Firestore listeners
- Types: `Chat`, `Message` in [src/types/index.ts](src/types/index.ts)
- Translation keys in `chat.*` namespace

#### Task 2.6: Client Profile

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/client/ClientProfilePage.tsx`  
**What to do:**

- View/edit profile information
- Booking history summary
- Settings (language, notifications)
- Logout functionality

---

### Phase 3: Provider Features

#### Task 3.1: Provider Profile Setup

**Status:** 🔴 Not Started  
**Files:** Create `src/pages/provider/ProviderProfileSetupPage.tsx`  
**What to do:**

- First-time setup after role selection
- Bio, location (city, area), radius for travel
- Profile photo upload (Firebase Storage)
- Type: `ProviderProfile` in [src/types/index.ts](src/types/index.ts)

#### Task 3.2: Service Management

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/provider/ProviderServicesPage.tsx`  
**What to do:**

- CRUD for services
- Set title, description, price range, duration
- Location type: at provider / at client / both
- Photo gallery for each service
- Type: `Service` in [src/types/index.ts](src/types/index.ts)

#### Task 3.3: Availability/Schedule Management

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/provider/ProviderSchedulePage.tsx`  
**What to do:**

- Weekly recurring availability (AvailabilityRule)
- Date-specific exceptions (AvailabilityException) - blocks/extra hours
- Calendar view of upcoming bookings
- Types defined in [src/types/index.ts](src/types/index.ts)

#### Task 3.4: Booking Requests Handling

**Status:** 🔴 Not Started  
**Files:** Enhance [src/pages/provider/ProviderDashboardPage.tsx](src/pages/provider/ProviderDashboardPage.tsx)  
**What to do:**

- List pending booking requests
- Accept/Reject with optional message
- Update booking status flow
- Push notifications (FCM integration)

#### Task 3.5: Provider Wallet & Payouts

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/provider/ProviderWalletPage.tsx`  
**What to do:**

- Display balance, pending balance
- Request payout
- Transaction history
- Types: `ProviderWallet`, `Payout`, `Payment` in [src/types/index.ts](src/types/index.ts)

---

### Phase 4: Admin Features

#### Task 4.1: User Management

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/admin/AdminUsersPage.tsx`  
**What to do:**

- List all users with role filter
- View user details
- Suspend/activate users
- Search by name/email

#### Task 4.2: Provider Verifications

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/admin/AdminVerificationsPage.tsx`  
**What to do:**

- List providers pending verification
- Review submitted documents
- Approve/reject with reason
- Update `ProviderProfile.isVerified`

#### Task 4.3: Payout Management

**Status:** 🔴 Not Started (Currently placeholder)  
**Files:** Create `src/pages/admin/AdminPayoutsPage.tsx`  
**What to do:**

- List payout requests
- Approve/reject payouts
- Mark as paid
- Type: `Payout` with statuses `REQUESTED`, `APPROVED`, `PAID`, `REJECTED`

#### Task 4.4: Reports & Disputes

**Status:** 🔴 Not Started  
**Files:** Create `src/pages/admin/AdminReportsPage.tsx`  
**What to do:**

- Handle user reports
- Manage disputed bookings
- Type: `Report` in [src/types/index.ts](src/types/index.ts)

---

### Phase 5: Payments & Notifications

#### Task 5.1: Payment Integration (Stripe)

**Status:** 🔴 Not Started  
**Files:** Create `src/lib/stripe.ts`, Cloud Functions for backend  
**What to do:**

- Stripe checkout for booking deposits
- Payment confirmation webhook handling
- Refund processing for cancellations
- Type: `Payment` with gateway `STRIPE` | `STUB`

#### Task 5.2: Push Notifications (FCM)

**Status:** 🔴 Not Started  
**Files:** Create `src/lib/notifications.ts`  
**What to do:**

- Firebase Cloud Messaging setup
- Notification permission request
- Handle booking status updates, chat messages
- Service worker for background notifications

---

### Phase 6: Polish & Production

#### Task 6.1: Form Validation with Zod

**Status:** 🔴 Not Started  
**Files:** Create `src/lib/validations/`  
**What to do:**

- Create Zod schemas for all forms
- Integrate with react-hook-form
- Pattern: `@hookform/resolvers/zod`

#### Task 6.2: Error Handling & Loading States

**Status:** 🔴 Not Started  
**What to do:**

- Global error boundary
- Consistent loading skeletons
- Toast notifications for actions
- Sonner toaster already configured in [src/App.tsx](src/App.tsx)

#### Task 6.3: Missing Route - Forgot Password

**Status:** 🔴 Not Started  
**Files:** Create `src/pages/auth/ForgotPasswordPage.tsx`  
**What to do:**

- Link exists in LoginPage but route doesn't exist
- Add route in [src/App.tsx](src/App.tsx)
- Firebase `sendPasswordResetEmail`

#### Task 6.4: Categories from Backend

**Status:** 🔴 Not Started  
**Files:** [src/pages/client/ClientHomePage.tsx](src/pages/client/ClientHomePage.tsx)  
**What to do:**

- Replace `mockCategories` with Firestore data
- Create categories in Firestore with `nameAr`, `nameEn`, `icon`
- Type: `Category` in [src/types/index.ts](src/types/index.ts)
