# Phase 7 – Customer Portal

## Objective

You are a **Senior Product Architect, UX Designer, and Full-Stack SaaS Engineer**.

Design and build a **modern, secure, AI-powered Customer Portal** for **SupportCraft AI**.

The Customer Portal is the external-facing application where customers can interact with an organization's support team.

The portal must provide a simple, intuitive experience while maintaining enterprise-grade security and performance.

The design should follow the **Aakasa Digital Design System** and integrate seamlessly with the SupportCraft AI platform.

The quality should be comparable to:

- Intercom Customer Portal
- Zendesk Help Center
- Freshdesk Customer Portal
- GitHub Support
- Atlassian Support
- Notion Help Center

---

# Technology Stack

Use:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase Realtime
- React Hook Form
- Zod
- Framer Motion

---

# Design Goals

The customer portal should feel:

- Modern
- Fast
- Professional
- Friendly
- Minimal
- AI-powered
- Mobile-first
- Easy to navigate

Customers should be able to solve their own issues whenever possible before contacting support.

---

# Portal Architecture

```
Public

Landing
Knowledge Base
Categories
Articles
Contact
Status Page (Future)

↓

Authentication

Magic Link

↓

Customer Portal

Dashboard
My Tickets
New Ticket
Ticket Details
Knowledge Base
Announcements
Profile
Notifications
```

---

# Public Pages

Create:

- Landing Page
- Knowledge Base Home
- Category Pages
- Article Pages
- Contact Page
- Login
- Register
- Forgot Password
- Reset Password

These pages should be SEO-friendly.

---

# Landing Page

Display:

Hero Section

Search Knowledge Base

Popular Articles

Common Categories

Recent Announcements

Submit Ticket CTA

Contact Support CTA

---

# Customer Authentication

Use Supabase Auth.

Support:

- Email & Password
- Magic Link
- Google Login (Optional)
- Microsoft Login (Optional)

Customers authenticate separately from support agents.

Customer accounts must never gain access to the internal dashboard.

---

# Customer Dashboard

Display:

Welcome Message

Open Tickets

Resolved Tickets

Waiting for Response

Announcements

Recent Activity

Suggested Knowledge Articles

Quick Actions

Quick Actions:

- Submit Ticket
- View Tickets
- Search Knowledge Base
- Update Profile

---

# Ticket List

Display customer's tickets.

Columns:

- Ticket Number
- Subject
- Status
- Priority
- Last Updated
- Created Date

Support:

- Search
- Filter
- Sort
- Pagination

Customers only see their own tickets.

---

# New Ticket

Create a modern ticket submission form.

Fields:

Subject

Category

Department

Priority (optional)

Description

Attachments

Preferred Contact Method

Before submission:

Display suggested Knowledge Base articles using AI search.

Reduce duplicate tickets.

---

# Ticket Details

Display:

Ticket Header

Conversation

Attachments

Status

Priority

Department

Created Date

Last Updated

Assigned Team

Customers may:

Reply

Upload Files

Close Ticket

Reopen Ticket (configurable)

Rate Resolution

---

# Conversation View

Display messages chronologically.

Support:

Rich Text

Attachments

Images

Markdown (optional)

Message Status

Typing Indicators (future)

Realtime Updates

---

# Attachments

Support:

Images

PDF

Office Documents

ZIP Files

Configurable Maximum File Size

Store using Supabase Storage.

Features:

Preview

Download

Drag & Drop

Multiple Upload

---

# Knowledge Base

Implement a modern documentation experience.

Features:

Categories

Articles

Search

Related Articles

Popular Articles

Recently Updated

Helpful Voting

Article Feedback

Estimated Reading Time

Code Blocks

Images

Videos (future)

---

# AI Knowledge Search

Before customers submit a ticket:

Search the knowledge base using AI.

Display:

Suggested Articles

Related FAQs

Possible Solutions

If an article solves the issue, encourage self-service before creating a ticket.

---

# AI Support Assistant

Create an AI assistant panel.

Features:

Summarize Articles

Suggest Solutions

Explain Technical Content

Guide Customer

Answer FAQs

Suggest Related Articles

Future:

AI Chatbot

---

# Announcements

Display organization announcements.

Examples:

Scheduled Maintenance

New Features

Known Issues

Product Updates

Announcements may be:

Pinned

Scheduled

Archived

---

# Notifications

Customers receive notifications when:

Ticket Created

Agent Replied

Ticket Closed

Ticket Assigned

Announcement Published

Support:

Unread Count

Mark as Read

View All

---

# Profile Management

Allow customers to update:

Full Name

Avatar

Email

Phone

Language

Timezone

Password

Notification Preferences

---

# Preferences

Customers can configure:

Email Notifications

Browser Notifications

Language

Theme

Timezone

Preferred Contact Method

---

# Search

Implement global search.

Search:

Knowledge Base

Tickets

Announcements

Support fuzzy search.

---

# Customer Satisfaction (CSAT)

After ticket resolution:

Display rating dialog.

Collect:

Rating (1–5)

Emoji

Comment

Store feedback for reporting.

---

# Security

Customers must never access:

Internal Notes

AI Internal Suggestions

Audit Logs

Other Customers

Organization Settings

Team Members

Billing

Reports

Implement strict Row Level Security (RLS).

---

# Realtime

Use Supabase Realtime.

Update automatically when:

Agent Replies

Ticket Updated

Status Changed

Announcement Published

Notification Created

---

# Responsive Design

Support:

Desktop

Laptop

Tablet

Mobile

Mobile experience should be fully optimized.

---

# Accessibility

Meet WCAG 2.2 AA.

Support:

Keyboard Navigation

Focus Indicators

ARIA Labels

Screen Readers

Accessible Forms

Accessible Tables

Accessible Dialogs

---

# Performance

Optimize for:

Server Components

Streaming

Lazy Loading

Image Optimization

Caching

Minimal JavaScript

Fast Initial Load

---

# Folder Structure

```text
app/
├── (portal)/
│   ├── page.tsx
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── tickets/
│   ├── knowledge-base/
│   ├── announcements/
│   ├── profile/
│   └── settings/

components/
├── portal/
│   ├── dashboard/
│   ├── tickets/
│   ├── knowledge-base/
│   ├── announcements/
│   ├── ai/
│   ├── profile/
│   ├── search/
│   └── shared/

lib/
├── portal/
├── knowledge-base/
├── search/
├── notifications/
├── realtime/
└── auth/
```

---

# Future Features

Design the architecture to support future enhancements without major refactoring.

Examples:

- Live Chat
- AI Chatbot
- WhatsApp Integration
- SMS Notifications
- Video Attachments
- Screen Recording Upload
- Community Forum
- Product Feedback Portal
- Customer Workspace
- Multi-language Portal
- White-label Customer Portals
- Custom Domains

---

# Deliverables

Generate:

1. Public Landing Page
2. Customer Authentication
3. Customer Dashboard
4. Ticket List
5. Ticket Details
6. Ticket Submission Form
7. Conversation Interface
8. Attachment Management
9. Knowledge Base
10. AI Knowledge Search
11. AI Assistant Panel
12. Announcement Center
13. Notification Center
14. Customer Profile
15. Settings & Preferences
16. Global Search
17. CSAT Rating System
18. Realtime Integration
19. Responsive Layout
20. Accessibility Enhancements
21. Security & RLS Validation
22. Component Documentation

---

# Success Criteria

The Customer Portal should:

- Deliver a premium self-service support experience
- Match the Aakasa Digital design language
- Reduce ticket volume through AI-powered knowledge discovery
- Provide a seamless experience across desktop and mobile devices
- Be secure by default using Supabase Authentication and Row Level Security
- Support real-time ticket updates and notifications
- Be easily extensible for future AI chat, live chat, and omnichannel support features
- Reuse the shared Design System and platform services
- Be production-ready, scalable, and maintainable for organizations of all sizes