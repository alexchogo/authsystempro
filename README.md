# AuthSystemPro

A complete, production-ready authentication system built with Next.js 15, Prisma, and PostgreSQL featuring:

- Email/Password authentication with email verification
- Two-factor authentication with OTP codes
- Password reset functionality
- Rate limiting and security features
- Audit logging
- Session management
- Modern UI with Radix UI components

## Features

- 🔐 **Secure Authentication**: Bcrypt password hashing, OTP verification
- � **Multi-User Support**: Concurrent user sessions with proper isolation
- 🎭 **Role-Based Access Control (RBAC)**: 10 predefined roles with granular permissions
- 🔒 **Granular Permissions**: 60+ permissions with `.own` vs `.all` access control
- 📧 **Email Verification**: Email verification with token-based system
- 🔑 **Password Reset**: Secure password reset flow with tokens
- 🛡️ **Enhanced Security**: Session isolation, audit logs, account locking, MFA support
- 🚦 **Rate Limiting**: Protect endpoints from abuse
- 🎨 **Modern UI**: Built with Radix UI and Tailwind CSS
- 📱 **Responsive**: Mobile-friendly design
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 🚀 **Type-safe**: Full TypeScript support

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (for rate limiting)
- SMTP server or Resend API key (for emails)

## Getting Started

### Quick Setup (Windows PowerShell)

```powershell
# Run the setup script
.\setup.ps1
```

This will:

1. Check if `.env` file exists and prompt to configure it
2. Install dependencies
3. Generate Prisma Client
4. Run database migrations

### Manual Setup

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Environment Setup

Create a `.env` file in the project root with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/authsystempro"
PRISMA_ACCELERATE_URL=""  # Optional: For Prisma Accelerate

# Node Environment
NODE_ENV="development"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT/Session Secrets (Generate secure random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
SESSION_SECRET="your-super-secret-session-key-min-32-chars"

# Redis (for rate limiting)
REDIS_URL="redis://localhost:6379"

# Email - SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="your-email@gmail.com"  # Email sender address

# Email - Resend API (Alternative to SMTP)
RESEND_API_KEY="re_your_api_key"

# SMS - Africa's Talking (Optional)
AT_API_KEY="your_africastalking_api_key"
AT_USERNAME="your_africastalking_username"
AT_NUMBER="your_shortcode_or_number"

# Optional: Sentry Error Tracking
# SENTRY_DSN="your_sentry_dsn"
```

#### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (creates roles, permissions, and default admin user)
# The seed script reads admin credentials from your environment variables.
# Copy `.env.example` to `.env` and set at minimum `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
npx ts-node prisma/seed.ts
# (Alternative) If you prefer to use Prisma's seed hook, configure it to run the same script
# and then run: npx prisma db seed
```

#### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Default Admin User

The seed script now creates the default `SUPER_ADMIN` user from environment variables instead of hard-coded credentials.

- Required env vars for the seed: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Optional env vars: `ADMIN_FULLNAME`, `ADMIN_USERNAME`, `ADMIN_PHONE`, `BCRYPT_SALT_ROUNDS` (defaults to `10`)

Example (copy `.env.example` to `.env` and edit):

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMeToAStrongPassword123!
ADMIN_FULLNAME="Alex Chogo"
ADMIN_USERNAME=alexchogo
ADMIN_PHONE=+254728931154
BCRYPT_SALT_ROUNDS=10
```

Run the seed after configuring `.env`:

```bash
npx ts-node prisma/seed.ts
```

⚠️ Important: use a strong, unique password for `ADMIN_PASSWORD` in production and rotate credentials after first login.

## Project Structure

```
authsystempro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (auth, profile, avatar, etc.)
│   │   ├── authpage/           # Authentication pages (signin, signup, forgot, otp, reset-password, verify-email)
│   │   ├── dashboard/          # Protected application UI (profile, activity, admin)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Reusable React components
│   │   ├── AvatarUpload.tsx
│   │   ├── IdleLogout.tsx
│   │   ├── Providers.tsx
│   │   └── ui/                 # UI primitives and Radix wrappers
│   ├── generated/              # Generated Prisma client/types
│   ├── hooks/                  # Custom React hooks
│   │   └── use-auth.ts
│   ├── lib/                    # Utility libraries and services (authService, tokens, send, redis, etc.)
│   ├── services/               # Backend services (prismaService, role.service, session.service)
│   └── middleware.ts           # Route protection and redirects
├── prisma/                     # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                     # Static assets (avatars, images)
├── scripts/                    # Utility scripts (e.g., email-test.ts)
├── .env.example                # Example env file
├── package.json
└── README.md
```

## Authentication Flow

### Sign Up Flow

1. User submits registration form
2. Password is hashed with bcrypt
3. User record created in database
4. Verification email sent with token
5. User clicks link in email
6. Email verified, user can sign in

### Sign In Flow

1. User submits credentials
2. Password verified against hash
3. OTP code generated and sent via email
4. User enters OTP code
5. Session token created and stored
6. User redirected to dashboard

### Password Reset Flow

1. User requests password reset
2. Reset token generated and sent via email
3. User clicks link and enters new password
4. Password updated in database
5. Reset token marked as used

## Route Protection

The application uses Next.js middleware for automatic route protection:

### Protected Routes

- `/dashboard` - Requires authentication, redirects to signin if not authenticated

### Auth Routes

- `/authpage/signin`, `/authpage/signup`, etc. - Redirects to dashboard if already authenticated

### Middleware Configuration

Located in `src/middleware.ts`, the middleware:

- Checks for `authToken` cookie
- Redirects unauthenticated users from protected routes to signin
- Redirects authenticated users from auth pages to dashboard
- Preserves the original destination URL for post-login redirect

### Client-Side Protection

Additionally, protected pages use the `useRequireAuth()` hook for client-side verification:

```typescript
import { useRequireAuth } from "@/hooks/use-auth";

export default function ProtectedPage() {
  useRequireAuth(); // Ensures user is authenticated
  // ... rest of component
}
```

### Adding New Protected Routes

To protect a new route, add it to the `protectedRoutes` array in `src/middleware.ts`:

```typescript
const protectedRoutes = ["/dashboard", "/profile", "/settings"];
```

## Roles & Permissions System

### Role Hierarchy

The system includes 10 predefined roles with increasing levels of access:

1. **SUPER_ADMIN** - Full system control, all permissions
2. **ADMIN** - Platform-level administration
3. **SECURITY_ADMIN** - Security, audit, and session management
4. **MANAGER** - User and content management
5. **MODERATOR** - Content moderation and user management
6. **EDITOR** - Content creation and publishing
7. **SUPPORT** - User support and assistance
8. **CONTRIBUTOR** - Create and manage own content
9. **USER** - Standard user with basic permissions
10. **GUEST** - Limited read-only access

### Permission Categories

#### Authentication & Session Management

- `session.read.own` / `session.read.all` - View own or all sessions
- `session.terminate.own` / `session.terminate.all` - End sessions
- `auth.login`, `auth.logout`, `auth.mfa` - Authentication actions

#### User Management

- `user.read.own` / `user.read.all` - View user profiles
- `user.update.own` - Update own profile
- `user.create`, `user.update`, `user.delete` - Manage users
- `user.assign-role` - Assign roles to users
- `user.lock` - Lock/unlock accounts
- `user.impersonate` - Impersonate other users (admin)
- `user.export` - Export user data

#### Content Management

- `content.read.own` / `content.read.all` - Read content
- `content.create`, `content.update.own` - Create and edit content
- `content.delete.own` / `content.delete` - Delete content
- `content.publish` - Publish content
- `content.moderate` - Moderate user content
- `media.upload`, `media.delete.own` - Manage media

#### System Administration

- `system.read`, `system.update` - System settings
- `system.audit` - View audit logs
- `system.security` - Security configuration
- `system.backup` - System backups

#### Role & Permission Management

- `role.read`, `role.create`, `role.update`, `role.delete`
- `permission.read`, `permission.assign`, `permission.manage`

### Concurrent User Sessions

The system supports **multiple users logged in simultaneously** with:

- **Session Isolation**: Each user's session is independent
- **Own vs All Permissions**: Users can only access their own data unless granted elevated permissions
- **Concurrent Safety**: Multiple users can perform actions at the same time without conflicts
- **Audit Trail**: All actions are logged with user attribution
- **Security Boundaries**: Strict permission checks prevent unauthorized access

### Example Role Permissions

**USER Role**:

```typescript
✓ Read own content
✓ Create content
✓ Update own profile
✓ Upload media
✓ View and manage own sessions
✗ Cannot view other users' data
✗ Cannot delete others' content
```

**EDITOR Role**:

```typescript
✓ All USER permissions
✓ Read all content
✓ Publish content
✓ Create and edit content
✗ Cannot manage users
✗ Cannot access system settings
```

**ADMIN Role**:

```typescript
✓ All EDITOR permissions
✓ Manage all users
✓ Assign roles
✓ View all sessions
✓ Access system settings
✓ View audit logs
✗ Cannot access security configuration
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in (sends OTP)
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/validate-reset-token` - Validate reset token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/resend-otp` - Resend OTP code
- `POST /api/logout` - Sign out user
- `GET /api/profile` - Get current user profile

## Security Features

### Authentication & Access Control

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Two-factor authentication via OTP
- ✅ Email verification required
- ✅ Secure password reset with expiring tokens
- ✅ Role-Based Access Control (RBAC) with 10 roles
- ✅ Granular permissions (60+ permissions)
- ✅ Permission-based authorization (`requirePermission`)

### Session & User Management

- ✅ Concurrent multi-user session support
- ✅ Session isolation (users can't access others' sessions)
- ✅ Session management with JWT tokens
- ✅ Account locking capabilities
- ✅ User impersonation (admin only)
- ✅ HTTP-only cookies for token storage

### Security Monitoring

- ✅ Rate limiting on all auth endpoints
- ✅ Login attempt tracking
- ✅ Comprehensive audit logging
- ✅ Security event monitoring
- ✅ Failed login detection

### Data Protection

- ✅ Input validation with Zod
- ✅ CSRF protection
- ✅ Route protection middleware (SSR + client-side)
- ✅ Own vs All permission separation
- ✅ Data export controls

## Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM

**Dependencies**

Below are the main runtime and development dependencies used in this project (see `package.json` for full list and versions):

- **Framework & Core**: `next`, `react`, `react-dom`
- **Database & ORM**: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`
- **Authentication & Security**: `bcrypt` / `bcryptjs`, `jsonwebtoken`, `iron-session`, `speakeasy`, `otp-generator`, `argon2`
- **Email & Messaging**: `nodemailer`, `@react-email/render`, `@react-email/components`, `africastalking`
- **Caching / Rate Limiting**: `ioredis`, `express-rate-limit`
- **UI & Styling**: `tailwindcss`, `shadcn-ui`, `@radix-ui/*` packages, `framer-motion`, `@chakra-ui/react`, `@emotion/react`, `@emotion/styled`
- **State & Data Fetching**: `@tanstack/react-query`, `zustand`, `react-hook-form`, `@tanstack/react-table`
- **Utilities & Validation**: `axios`, `date-fns`, `zod`, `uuid`, `nanoid`, `validator`, `clsx`
- **Logging & Monitoring**: `pino`, `pino-pretty`, `@sentry/nextjs`
- **Dev / Build Tools**: `typescript`, `ts-node`, `prisma`, `eslint`, `prettier`, `jest`, `tailwindcss`, `postcss`

Tip: run `npm ls --depth=0` to view installed top-level packages locally, or open `package.json` for exact versions.

- **Caching**: Redis for rate limiting
- **UI**: Radix UI + Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Authentication**: Custom implementation
- **Email**: Nodemailer (SMTP) or Resend API

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name <migration-name>

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Environment Variables

### Required Variables

| Variable              | Description                          | Required | Default |
| --------------------- | ------------------------------------ | -------- | ------- |
| `DATABASE_URL`        | PostgreSQL connection string         | Yes      | -       |
| `NODE_ENV`            | Environment (development/production) | Yes      | -       |
| `NEXT_PUBLIC_APP_URL` | Application URL                      | Yes      | -       |
| `JWT_SECRET`          | JWT signing secret (min 32 chars)    | Yes      | -       |
| `SESSION_SECRET`      | Session encryption secret            | Yes      | -       |
| `REDIS_URL`           | Redis connection string              | Yes      | -       |

### Email Configuration (Choose One)

**Option 1: SMTP**

| Variable     | Description           | Required |
| ------------ | --------------------- | -------- |
| `SMTP_HOST`  | SMTP server hostname  | Yes\*    |
| `SMTP_PORT`  | SMTP server port      | Yes\*    |
| `SMTP_USER`  | SMTP username/email   | Yes\*    |
| `SMTP_PASS`  | SMTP password/app key | Yes\*    |
| `FROM_EMAIL` | Sender email address  | Yes\*    |

**Option 2: Resend API**

| Variable         | Description    | Required |
| ---------------- | -------------- | -------- |
| `RESEND_API_KEY` | Resend API key | Yes\*    |
| `FROM_EMAIL`     | Sender email   | Yes\*    |

\* Either configure SMTP or Resend for emails

### Optional Variables

| Variable                | Description                  | Required | Default |
| ----------------------- | ---------------------------- | -------- | ------- |
| `PRISMA_ACCELERATE_URL` | Prisma Accelerate connection | No       | -       |
| `AT_API_KEY`            | Africa's Talking API key     | No       | -       |
| `AT_USERNAME`           | Africa's Talking username    | No       | -       |
| `AT_NUMBER`             | Africa's Talking shortcode   | No       | -       |
| `SENTRY_DSN`            | Sentry error tracking DSN    | No       | -       |

## Troubleshooting

### Email not sending

- Check SMTP credentials in `.env`
- For Gmail, use an App Password
- Alternatively, use Resend API

### Database connection errors

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check network connectivity

### Rate limiting issues

- Ensure Redis is running
- Verify `REDIS_URL` is correct
- Check Redis connection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
