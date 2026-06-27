# Phase 6 – Ticket Management System

## Objective

You are a **Senior Product Architect, UX Designer, and Full-Stack SaaS Engineer**.

Design and build a **production-ready, enterprise-grade Ticket Management System** for **SupportCraft AI**.

This is the core module of the platform and should be designed to support:

- Freelancers
- Small businesses
- Agencies
- SaaS companies
- Enterprise customers

The ticket management experience should be modern, intuitive, fast, and AI-assisted while following the **Aakasa Digital Design System**.

The quality should be comparable to:

- Zendesk
- Freshdesk
- Intercom
- Jira Service Management
- Linear
- GitHub Issues

---

# Technology Stack

Use:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase
- Supabase Realtime
- React Hook Form
- Zod
- TanStack Table
- Framer Motion

---

# Ticket Lifecycle

Support the complete ticket lifecycle.

```
New

↓

Open

↓

In Progress

↓

Waiting for Customer

↓

Resolved

↓

Closed

```

Support:

- Reopen Ticket
- Merge Tickets
- Split Ticket
- Archive Ticket (Future)

Every action must be recorded in the activity log.

---

# Ticket Number Format

Automatically generate ticket numbers.

Example:

```
SUP-1001

SUP-1002

SUP-1003
```

Support custom prefixes in Organization Settings.

---

# Ticket List

Create a powerful ticket listing page.

Columns:

- Ticket Number
- Subject
- Customer
- Company
- Status
- Priority
- Category
- Department
- Assigned Agent
- SLA
- Last Updated
- Created Date

Features:

- Search
- Sorting
- Pagination
- Column Visibility
- Saved Filters
- Bulk Selection
- Bulk Actions
- Export
- Responsive Layout

---

# Search

Global ticket search.

Support:

- Ticket Number
- Subject
- Customer Name
- Customer Email
- Tags
- Ticket Content
- Internal Notes

Implement PostgreSQL Full Text Search.

---

# Filters

Support filtering by:

- Status
- Priority
- Category
- Department
- Agent
- Customer
- Date Range
- SLA Status
- Ticket Source
- Tags
- AI Generated
- Unassigned

Support multiple filters simultaneously.

Allow users to save filter presets.

---

# Sorting

Support sorting by:

- Ticket Number
- Last Updated
- Created Date
- Priority
- Status
- Customer
- SLA
- Assigned Agent

---

# Ticket Detail Page

Create a professional ticket workspace.

Layout:

```
---------------------------------------------------------

Header

---------------------------------------------------------

Conversation

Customer Details

Ticket Information

AI Panel

Activity Timeline

---------------------------------------------------------

Reply Editor

---------------------------------------------------------
```

The page should support two-column and three-column layouts depending on screen size.

---

# Ticket Header

Display:

- Ticket Number
- Subject
- Status
- Priority
- Department
- Category
- Assigned Agent
- SLA
- Created Date
- Last Updated

Quick Actions:

- Assign
- Change Status
- Change Priority
- Merge
- Close
- Delete (Owner/Admin only)

---

# Conversation Timeline

Display all ticket messages chronologically.

Message Types:

- Customer Reply
- Agent Reply
- Internal Note
- AI Suggestion
- System Event

Each message should display:

- Avatar
- Name
- Role
- Timestamp
- Rich Text
- Attachments
- Edited Indicator

---

# Reply Editor

Support:

- Rich Text Editor
- Markdown
- Emoji Picker
- Mentions (@user)
- Attachments
- Drag & Drop Upload
- Inline Images
- Signature
- Saved Drafts
- Autosave

Buttons:

- Send Reply
- Internal Note
- Save Draft
- AI Improve
- AI Generate Reply

---

# Attachments

Support uploading:

- Images
- PDFs
- Office Documents
- ZIP Files
- Videos (Configurable)

Store files using Supabase Storage.

Features:

- Drag & Drop
- Preview
- Download
- Delete
- Multiple Files

---

# Internal Notes

Agents can create private notes.

Internal notes:

- Are never visible to customers
- Support mentions
- Support attachments
- Support AI summaries

---

# Customer Information Panel

Display:

- Avatar
- Name
- Company
- Email
- Phone
- Language
- Timezone
- Previous Tickets
- Customer Since
- Satisfaction Score
- Recent Activity

Quick Actions:

- View Customer
- Send Email
- Start Chat (Future)

---

# Ticket Information Panel

Display:

- Status
- Priority
- Department
- Category
- Assigned Agent
- Source
- Tags
- SLA Policy
- Due Date
- Related Tickets

Editable inline.

---

# AI Assistant Panel

Dedicated AI workspace.

Features:

Generate Reply

Improve Reply

Summarize Ticket

Detect Priority

Detect Sentiment

Suggest Category

Suggest Department

Suggest Tags

Translate Reply

Rewrite Professionally

Grammar Check

Knowledge Base Suggestions

Next Best Action

Customer Intent Analysis

Root Cause Detection

Estimated Resolution Time

Every AI action should display:

- Confidence Score
- Processing Status
- Usage Cost (optional)

---

# Activity Timeline

Log every action.

Examples:

Ticket Created

Status Changed

Priority Updated

Assigned Agent

Customer Replied

Internal Note Added

AI Reply Generated

Attachment Uploaded

Knowledge Article Linked

Display:

- User
- Action
- Timestamp

---

# Tags

Support unlimited tags.

Features:

- Create
- Edit
- Delete
- Color Coding
- Auto Suggestions

---

# SLA Tracking

Display:

- First Response Due
- Resolution Due
- Remaining Time
- Breached Status

Visual indicators:

- Green
- Yellow
- Red

---

# Bulk Actions

Support:

Assign Agent

Change Status

Change Priority

Move Department

Merge

Delete

Add Tags

Remove Tags

Export

Close

Resolve

---

# Ticket Relationships

Support:

Parent Ticket

Child Tickets

Duplicate Tickets

Related Tickets

Blocked By

Blocks

---

# Customer Visibility

Customers may only see:

- Public Replies
- Attachments
- Status
- Ticket History

Customers must never see:

- Internal Notes
- AI Suggestions
- Audit Logs
- Team Discussions

---

# Realtime Updates

Use Supabase Realtime.

Update automatically when:

New Reply

Status Change

Assignment

New Internal Note

AI Completion

Attachment Uploaded

Customer Replied

---

# Notifications

Notify agents when:

Assigned Ticket

Mentioned

Customer Reply

SLA Warning

High Priority Ticket

AI Completed

---

# Keyboard Shortcuts

Support:

New Ticket

Reply

Internal Note

Search

Assign

Close Ticket

Open Command Palette

---

# Ticket Templates

Support reusable templates.

Examples:

Billing

Bug Report

Password Reset

Refund

Feature Request

General Inquiry

Templates should prefill:

Subject

Body

Category

Department

Priority

---

# Ticket Views

Create default views.

Examples:

All Tickets

My Tickets

Open

Waiting for Customer

High Priority

Overdue

Resolved Today

Unassigned

Users can create custom saved views.

---

# Automation Hooks

Prepare for future automation.

Events:

Ticket Created

Status Changed

Reply Added

Customer Replied

Assigned

Closed

Resolved

These events should be available to the Automation Engine.

---

# Permissions

Respect RBAC.

Owner

Admin

Agent

Viewer

Customers

Every action must validate permissions before execution.

---

# Accessibility

Meet WCAG 2.2 AA.

Include:

Keyboard Navigation

Focus Indicators

Screen Reader Support

Accessible Tables

Accessible Forms

High Contrast

---

# Performance

Optimize for:

Large Ticket Volumes

Realtime Updates

Lazy Loading

Infinite Scroll (Optional)

Server Components

Efficient Database Queries

Caching

---

# Folder Structure

```text
app/
└── dashboard/
    └── tickets/
        ├── page.tsx
        ├── new/
        └── [ticketId]/

components/
├── tickets/
│   ├── list/
│   ├── detail/
│   ├── conversation/
│   ├── editor/
│   ├── attachments/
│   ├── ai/
│   ├── activity/
│   ├── customer/
│   ├── filters/
│   ├── templates/
│   └── shared/

lib/
├── tickets/
├── sla/
├── notifications/
├── search/
├── realtime/
└── permissions/
```

---

# Deliverables

Generate:

1. Ticket List Page
2. Ticket Detail Page
3. Ticket Creation Flow
4. Ticket Reply Editor
5. Conversation Timeline
6. Internal Notes System
7. Attachment Management
8. Customer Information Panel
9. Ticket Information Panel
10. AI Assistant Panel
11. Activity Timeline
12. SLA Monitoring
13. Search Engine
14. Advanced Filters
15. Saved Views
16. Bulk Actions
17. Ticket Templates
18. Realtime Updates
19. Notification Integration
20. Permission Validation
21. Accessibility Enhancements
22. Performance Optimizations
23. Component Documentation

---

# Success Criteria

The Ticket Management System should:

- Feel comparable to leading enterprise help desk platforms
- Follow the Aakasa Digital Design System
- Scale to millions of tickets and thousands of organizations
- Be fully multi-tenant with Supabase Row Level Security
- Deliver real-time collaboration using Supabase Realtime
- Surface AI assistance naturally throughout the workflow
- Be responsive across desktop, tablet, and mobile devices
- Reuse shared components and services to support future Aakasa Digital products
- Be production-ready with clean architecture, comprehensive validation, and maintainable code