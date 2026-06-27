# Phase 4 – Authentication & Authorization

## Objective

You are a **Senior Identity & Access Management (IAM) Architect** and **Supabase Authentication Expert**.

Design and implement a **production-ready authentication, authorization, and organization onboarding system** for **SupportCraft AI**.

The authentication system must be:

- Secure by default
- Multi-tenant
- Scalable
- Extensible
- Easy for end users
- Enterprise-ready

Use **Supabase Auth** as the authentication provider while implementing custom authorization and organization management within the application.

---

# Technology Stack

Use:

- Supabase Auth
- Next.js 15 (App Router)
- TypeScript
- Supabase SSR
- PostgreSQL
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

Do **not** build a custom authentication system.

Leverage Supabase Auth for identity management.

---

# Authentication Goals

SupportCraft AI must support:

- Email & Password Authentication
- Google OAuth
- Magic Link Login
- Password Reset
- Email Verification
- Session Management
- Secure Logout
- Multi-Organization Access
- Customer Portal Authentication
- API Authentication (Future)

---

# User Types

Support two primary user types.

## Internal Users

These users belong to organizations.

Examples:

- Owner
- Administrator
- Support Agent
- Viewer

They access:

- Dashboard
- Tickets
- Customers
- Reports
- Settings

---

## Customers

Customers access only the Customer Portal.

Customers can:

- Submit Tickets
- View Their Tickets
- Reply to Tickets
- Download Attachments
- Search Knowledge Base
- Manage Their Profile

Customers must never have access to the internal dashboard.

---

# Authentication Providers

Implement:

- Email & Password
- Google
- Microsoft

Design the architecture to allow future providers such as:

- GitHub
- Apple
- LinkedIn
- SAML
- Azure AD
- Okta

Provider-specific logic should remain isolated.

---

# Organization Onboarding

When a new user signs up:

## Step 1

Create account using Supabase Auth.

---

## Step 2

Verify email.

---

## Step 3

Create Profile.

Automatically create:

profiles

Record linked to:

auth.users

---

## Step 4

Create Organization.

Collect:

- Organization Name
- Organization Slug
- Company Website (optional)
- Timezone
- Country

Automatically assign:

Role:

Owner

---

## Step 5

Create Default Data.

Automatically create:

- Departments
- Ticket Statuses
- Priorities
- Categories
- Organization Settings

---

## Step 6

Redirect to Dashboard.

---

# Invitation System

Owners and Admins can invite team members.

Invitation workflow:

1. Invite by email

2. Assign role

3. Assign department

4. Email invitation

5. Accept invitation

6. Create account (if needed)

7. Join organization

Support invitation expiration.

Support invitation cancellation.

---

# Multi-Organization Support

A single user may belong to multiple organizations.

Requirements:

- Organization Switcher
- Remember Last Organization
- Organization Context
- Separate Permissions Per Organization

Switching organizations should update:

- Active Workspace
- Navigation
- Data
- Permissions

without requiring a new login.

---

# Role-Based Access Control (RBAC)

Implement RBAC.

Roles:

## Owner

Full system access.

Can:

- Billing
- Delete organization
- Manage users
- API keys
- Settings
- AI Settings

---

## Admin

Can manage:

- Tickets
- Customers
- Knowledge Base
- Reports
- Agents

Cannot:

- Delete organization
- Transfer ownership

---

## Agent

Can:

- View tickets
- Reply
- Assign tickets
- Use AI features
- Update customers

Cannot:

- Billing
- Organization settings

---

## Viewer

Read-only access.

---

# Customer Authorization

Customers may only access:

Their own:

- Tickets
- Replies
- Attachments
- Profile

Customers must never see:

Other customers

Internal notes

Team members

AI usage

Reports

Settings

---

# Session Management

Use secure Supabase sessions.

Requirements:

- Persistent Login
- Secure Cookies
- Automatic Refresh Tokens
- Session Expiration
- Logout Everywhere (future)

Implement:

Session Provider

Auth Middleware

Protected Routes

---

# Route Protection

Protect all dashboard routes.

Examples:

/dashboard

/dashboard/tickets

/dashboard/customers

/dashboard/settings

/dashboard/reports

/dashboard/knowledge-base

Redirect unauthenticated users.

Redirect unauthorized users.

---

# Customer Portal Protection

Protect:

/portal

/portal/tickets

/portal/profile

Customers should never access dashboard routes.

---

# Middleware

Implement Next.js middleware.

Responsibilities:

- Validate Session
- Redirect Guests
- Redirect Unauthorized Users
- Inject Active Organization
- Check Organization Membership

---

# Permissions System

Create reusable permission helpers.

Examples:

canViewTicket()

canAssignTicket()

canManageUsers()

canManageBilling()

canUseAI()

canDeleteOrganization()

Permissions should be reusable across:

- Components
- API Routes
- Server Actions
- Edge Functions

---

# Authorization Helpers

Create reusable helpers.

Examples:

requireAuth()

requireOrganization()

requireRole()

requirePermission()

getCurrentUser()

getCurrentOrganization()

---

# User Profile

Create Profile Management.

Fields:

- Full Name
- Avatar
- Email
- Timezone
- Language
- Phone
- Job Title

Users can update:

- Password
- Avatar
- Personal Settings

---

# Organization Profile

Manage:

- Logo
- Organization Name
- Website
- Support Email
- Timezone
- Branding
- Business Hours

---

# Audit Logging

Log authentication events.

Examples:

- Login
- Logout
- Failed Login
- Password Reset
- Invitation Accepted
- Organization Created
- User Invited
- Role Changed

Store:

- User
- Organization
- Timestamp
- IP Address
- User Agent

---

# Security

Implement best practices.

Include:

- Email Verification
- CSRF Protection
- XSS Prevention
- SQL Injection Protection
- Rate Limiting
- Secure Cookies
- Password Strength Validation
- OAuth State Validation

Never expose sensitive information.

---

# Error Handling

Create friendly authentication pages.

Examples:

Invalid Login

Expired Invitation

Email Already Exists

Organization Not Found

Unauthorized

Access Denied

Session Expired

Each page should:

- Explain the issue
- Suggest the next action
- Match the Aakasa Digital design system

---

# UI Pages

Create:

Public

- Login
- Register
- Forgot Password
- Reset Password
- Verify Email
- Accept Invitation

Authenticated

- Profile
- Organization Switcher
- Team Members
- User Settings

---

# Folder Structure

Organize authentication using feature-based architecture.

```text
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── verify-email/
│   └── invitation/
│
├── dashboard/
├── portal/
│
components/
├── auth/
├── profile/
├── organizations/
│
lib/
├── auth/
├── permissions/
├── organizations/
│
middleware.ts
```

---

# Deliverables

Generate:

1. Authentication Architecture
2. Supabase Auth Integration
3. OAuth Configuration
4. Middleware
5. Session Provider
6. Organization Switcher
7. Invitation System
8. Role-Based Access Control
9. Permission Helpers
10. Authentication Pages
11. Profile Management
12. Organization Management
13. Audit Logging
14. Route Protection
15. Customer Portal Authentication
16. Error Pages
17. Security Best Practices
18. Developer Documentation

---

# Success Criteria

The authentication system should:

- Follow Supabase Authentication best practices
- Be secure by default
- Support multi-tenant organizations
- Support multiple authentication providers
- Provide granular authorization
- Separate internal users from customer portal users
- Scale to enterprise workloads
- Integrate seamlessly with future Aakasa Digital products
- Serve as the shared identity platform across the Aakasa Digital ecosystem