# Develo CRM

A modern SaaS CRM application with a merged marketing website and software application, built with React, Vite, and Tailwind CSS.

## Features

- **Merged Website & Software**: Single React application with unified design system
- **Role-Based Access**: Admin, Employee, and Client dashboards
- **Responsive Design**: Mobile-first approach with full mobile support
- **Authentication**: Login, Signup, Forgot Password, and Reset Password flows
- **Modern UI**: 3D button effects, smooth animations, and consistent design language

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- React Router v6
- React Icons

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── app/              # Protected application pages
│   ├── admin/        # Admin dashboard and pages
│   ├── employee/     # Employee dashboard and pages
│   └── client/       # Client dashboard and pages
├── auth/             # Authentication pages
│   └── pages/        # Login, Signup, Forgot Password, etc.
├── components/       # Reusable components
│   ├── layout/       # Sidebar, TopBar
│   └── ui/           # Button, Card, Modal, Input
├── context/          # React Context (AuthContext)
├── layouts/          # Layout components
│   ├── WebsiteLayout
│   ├── AuthLayout
│   └── AppLayout
├── routes/           # Route configuration
└── website/          # Marketing website pages
    ├── components/   # Website Header, Footer
    └── pages/        # Home, Pricing, Contact
```

## Routing

### Public Routes
- `/` - Marketing website home
- `/pricing` - Pricing page
- `/contact` - Contact page

### Auth Routes
- `/login` - Login page
- `/signup` - Signup page
- `/forgot-password` - Forgot password
- `/reset-password` - Reset password

### Protected Routes
- `/app/admin/dashboard` - Admin dashboard
- `/app/employee/dashboard` - Employee dashboard
- `/app/client/dashboard` - Client dashboard

## Demo Accounts

For testing purposes, the login system uses email-based role detection:

- Email containing "admin" → Admin role
- Email containing "employee" → Employee role
- Any other email → Client role

Example emails:
- `admin@example.com` → Admin
- `employee@example.com` → Employee
- `client@example.com` → Client

## Design System

### Colors
- Primary Dark: `#102D2C` (Sidebar/Header)
- Primary Accent: `#217E45` (Buttons)
- Secondary Accent: `#76AF88`
- Main Background: `#F0F1F1`
- Primary Text: `#102D2C`
- Secondary Text: `#767A78`
- Muted Text: `#9A9A9C`
- Warning: `#BCB474`
- Danger: `#CC9CA4`

### Components
- All buttons have 3D hover effects
- Cards use white background with soft shadows
- Border radius: 10-14px
- Consistent spacing and typography

## Features by Role

### Admin
- Full system access
- All modules available
- User management
- Advanced analytics

### Employee
- Task management
- Client interactions
- Work tracking
- Team collaboration

### Client
- Project visibility
- Order tracking
- Communication
- Invoice access

## Development Notes

- This is a UI-only implementation (no real backend)
- Authentication state is stored in localStorage
- All modals are reusable and responsive
- Mobile sidebar collapses automatically
- All navigation is functional

## License

MIT

