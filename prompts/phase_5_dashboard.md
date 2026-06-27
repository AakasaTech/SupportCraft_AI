# Phase 5 – Dashboard

## Objective

You are a **Senior Product Designer, UX Architect, and Full-Stack SaaS Engineer**.

Design and build the complete **SupportCraft AI Dashboard**.

The dashboard is the primary workspace for support agents, administrators, and business owners.

It should provide a clean, modern, AI-powered overview of customer support operations while following the **Aakasa Digital Design System** created in Phase 2.

The dashboard must feel comparable in quality to:

- Linear
- Intercom
- Zendesk
- GitHub
- Vercel
- Stripe Dashboard
- Notion

The experience should be fast, intuitive, responsive, and highly informative.

---

# Technology Stack

Use:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Lucide React
- Supabase
- TanStack Table
- Recharts (or Tremor Charts)

The dashboard should consume data from Supabase using Server Components where possible.

---

# Dashboard Goals

Provide users with an immediate understanding of:

- Current workload
- Ticket health
- Team performance
- Customer satisfaction
- SLA compliance
- AI usage
- Business insights

The dashboard should answer:

- What needs my attention?
- Which tickets are overdue?
- Which customers need responses?
- How is my team performing?
- How much AI is being used?
- What has changed today?

---

# Dashboard Layout

Create a modern SaaS layout.

```
-------------------------------------------------------
 Top Navigation
-------------------------------------------------------

 Sidebar | Dashboard Content

         | KPI Cards
         |
         | Ticket Charts
         |
         | Recent Activity
         |
         | Assigned Tickets
         |
         | AI Insights
         |
         | Team Performance
         |
         | Quick Actions

-------------------------------------------------------
```

Everything should be responsive.

---

# Sidebar Navigation

Include:

Dashboard

Tickets

Customers

Knowledge Base

Reports

Automation

Team

Notifications

Billing

Settings

Organization Switcher

Collapse / Expand support.

---

# Top Navigation

Include:

Global Search

Command Palette (Ctrl/Cmd + K)

Organization Switcher

Notifications

Theme Switcher

User Menu

Profile

Logout

Support button

---

# Welcome Section

Display:

Welcome back, {User Name}

Greeting based on local time.

Show:

Today's Date

Organization Name

Current Plan

AI Credits Remaining

---

# KPI Cards

Create reusable KPI widgets.

Cards include:

## Open Tickets

Display:

- Total
- Daily Change
- Trend

---

## Assigned To Me

Display:

- Total Assigned
- High Priority Count

---

## Waiting For Customer

Display:

- Ticket Count

---

## Overdue Tickets

Display:

- Total
- Critical Count

Highlight in warning colors.

---

## Resolved Today

Display:

- Count
- Comparison to yesterday

---

## Average First Response Time

Display:

- Time
- Trend

---

## Average Resolution Time

Display:

- Time
- Weekly Trend

---

## Customer Satisfaction

Display:

- Rating
- Emoji indicator
- Weekly change

---

## AI Usage

Display:

- Requests Today
- Tokens Used
- Estimated Cost

---

# Ticket Analytics

Charts:

Daily Ticket Volume

Weekly Ticket Volume

Monthly Ticket Volume

Open vs Closed

Priority Distribution

Category Distribution

Department Distribution

Channel Distribution

Response Time Trend

Resolution Trend

All charts should support:

Hover

Tooltips

Responsive resizing

---

# Assigned Tickets Widget

Display tickets assigned to current user.

Columns:

Ticket Number

Customer

Subject

Priority

Status

Last Updated

SLA Remaining

Quick Actions

---

# Recent Activity

Display chronological timeline.

Examples:

Ticket created

Ticket assigned

Customer replied

AI generated response

Knowledge article published

Agent joined

Organization updated

---

# AI Insights Panel

Dedicated AI section.

Examples:

Suggested high-priority tickets

Sentiment alerts

Suggested knowledge articles

Customers likely to churn

AI-generated daily summary

AI recommendations

Reply suggestions

Workflow suggestions

Display confidence score.

---

# SLA Monitoring

Display:

Tickets nearing SLA breach

Breached tickets

Average SLA performance

Upcoming deadlines

Use visual indicators.

---

# Team Performance

Display:

Agent workload

Open tickets

Resolved today

Average response time

CSAT

AI usage

Leaderboard (optional)

---

# Customer Insights

Display:

Most active customers

New customers

Customers waiting longest

VIP customers

Repeat customers

---

# Quick Actions

Buttons:

New Ticket

New Customer

Create Knowledge Article

Invite Team Member

Generate AI Reply

View Reports

Configure Automation

---

# Notifications Widget

Display:

Unread notifications

Recent alerts

AI alerts

SLA alerts

Customer replies

Mention notifications

Support:

Mark as read

View all

---

# Global Search

Support searching:

Tickets

Customers

Knowledge Articles

Organizations

Team Members

Commands

Keyboard shortcut:

Ctrl/Cmd + K

---

# Command Palette

Actions:

Create Ticket

Assign Ticket

Search Customer

Open Settings

View Reports

Generate AI Reply

Navigate Anywhere

---

# Dashboard Filters

Allow filtering by:

Date Range

Department

Agent

Priority

Status

Category

Support Channel

Saved Views

---

# Personalization

Users can:

Rearrange widgets

Hide widgets

Resize widgets

Save layouts

Create multiple dashboard views

Remember preferences.

---

# Realtime Updates

Use Supabase Realtime.

Update automatically when:

Ticket created

Ticket assigned

Reply received

Customer created

Notification received

AI completed

No manual refresh required.

---

# Loading States

Create:

Skeleton Cards

Skeleton Charts

Skeleton Tables

Loading Spinner

Progress Indicators

---

# Empty States

Examples:

No Tickets

No Activity

No Reports

No AI Usage

No Notifications

Each should include:

Illustration

Helpful text

Primary action

---

# Error States

Gracefully handle:

Database errors

Network issues

Permission denied

Realtime disconnect

Empty datasets

Provide retry options.

---

# Responsive Design

Support:

Desktop

Laptop

Tablet

Mobile

Mobile dashboard should prioritize:

Open Tickets

Assigned Tickets

Notifications

Quick Actions

---

# Accessibility

Comply with WCAG 2.2 AA.

Include:

Keyboard navigation

ARIA labels

Screen reader support

Accessible charts

Focus indicators

High color contrast

---

# Performance

Optimize for:

Fast initial load

Lazy-loaded charts

Server Components

Streaming

Caching

Minimal client-side JavaScript

Avoid unnecessary re-renders.

---

# Folder Structure

```
app/
└── dashboard/

components/
├── dashboard/
│   ├── cards/
│   ├── charts/
│   ├── widgets/
│   ├── activity/
│   ├── ai/
│   ├── notifications/
│   ├── team/
│   ├── customers/
│   └── layout/

lib/
├── dashboard/
├── analytics/
├── charts/
└── realtime/
```

---

# Deliverables

Generate:

1. Dashboard Layout
2. Responsive Sidebar
3. Top Navigation
4. Welcome Banner
5. KPI Cards
6. Dashboard Widgets
7. Analytics Charts
8. Ticket Widgets
9. AI Insights Panel
10. Team Performance Dashboard
11. SLA Dashboard
12. Customer Insights
13. Notifications Widget
14. Quick Actions
15. Global Search
16. Command Palette
17. Personalization System
18. Realtime Integration
19. Loading States
20. Empty States
21. Error Handling
22. Accessibility Enhancements
23. Performance Optimizations
24. Component Documentation

---

# Success Criteria

The completed dashboard should:

- Match the Aakasa Digital design language
- Feel modern, fast, and intuitive
- Scale from freelancers to enterprise teams
- Provide real-time operational visibility
- Surface AI-powered insights naturally
- Be fully responsive and accessible
- Reuse components from the shared Design System
- Serve as the primary workspace for all authenticated SupportCraft AI users