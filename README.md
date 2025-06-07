# Shift Management System

A role-based shift management system with swap requests, manager approvals, and audit trails built with React and Express.

## Features

- **User Authentication** with Replit Auth
- **Role-based Access** (Staff and Manager)
- **Shift Management** - Create and view shifts
- **Shift Swap Requests** - Request shift swaps with other staff
- **Manager Approval System** - Managers can approve/reject swap requests
- **Audit Trail** - Complete logging of all actions
- **Analytics Dashboard** - Department statistics and recent decisions
- **CSV Export** - Export swap request data

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Neon (serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Replit Auth with Passport.js

## Local Development Setup

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (or Neon account)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd shift-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   SESSION_SECRET=your_session_secret_key
   ```

4. **Database Setup**
   ```bash
   # Push the schema to your database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Database Schema

The application uses the following tables:
- `users` - User profiles and roles
- `shifts` - Shift schedules
- `swap_requests` - Shift swap requests
- `audit_logs` - Activity tracking
- `sessions` - User sessions

### Project Structure

```
├── client/src/           # React frontend
│   ├── components/ui/    # UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   ├── db.ts           # Database connection
│   └── replitAuth.ts   # Authentication
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema
└── package.json         # Dependencies and scripts
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run check` - TypeScript type checking

### API Endpoints

#### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Login with Replit Auth

#### Shifts
- `GET /api/shifts` - Get user shifts
- `POST /api/shifts` - Create new shift

#### Swap Requests
- `GET /api/swap-requests` - Get user's swap requests
- `POST /api/swap-requests` - Create swap request
- `GET /api/swap-requests/available` - Get available swaps
- `POST /api/swap-requests/:id/volunteer` - Volunteer for swap

#### Manager Operations
- `GET /api/manager/pending-requests` - Get pending approvals
- `POST /api/manager/approve/:id` - Approve swap request
- `POST /api/manager/reject/:id` - Reject swap request

#### Analytics
- `GET /api/analytics/departments` - Department statistics
- `GET /api/analytics/recent-decisions` - Recent manager decisions
- `GET /api/export/csv` - Export data as CSV

#### Audit
- `GET /api/audit-logs` - Get user audit logs

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License

MIT License