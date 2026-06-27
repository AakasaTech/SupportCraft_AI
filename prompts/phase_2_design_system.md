# Phase 2 – Design System

## Objective

You are a **Senior Product Designer, UX Architect, and Frontend Engineer** specializing in modern SaaS applications.

Your task is to design and implement the complete **SupportCraft AI Design System** using:

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Lucide React

This design system will become the **shared UI foundation** for all **Aakasa Digital** products, including:

- SupportCraft AI
- BillCraft AI
- Future Aakasa Digital SaaS applications

---

# Design Philosophy

SupportCraft AI is an AI-powered customer support platform.

The UI should feel:

- Modern
- Premium
- Professional
- Trustworthy
- Clean
- Minimal
- Friendly
- Fast
- AI-first

Inspired by:

- Linear
- Notion
- Stripe Dashboard
- Vercel
- GitHub
- Intercom

Avoid visual clutter.

Prioritize:

- Whitespace
- Readability
- Productivity
- Consistency

---

# Brand Identity

Follow the Aakasa Digital branding.

Characteristics:

- White backgrounds
- Blue gradient accents
- Deep navy typography
- Light gray surfaces
- Rounded corners
- Soft shadows
- Subtle glass effects
- Clean iconography
- Smooth animations

The experience should communicate:

> Professional AI Software

---

# Color System

Create semantic design tokens.

Never hardcode colors.

Include tokens for:

- Primary
- Secondary
- Accent
- Success
- Warning
- Error
- Info
- Background
- Surface
- Border
- Text
- Muted
- Sidebar
- Card
- Overlay
- Hover
- Focus
- Disabled

Support:

- Light Theme
- Dark Theme

Dark mode must be designed independently—not simply inverted.

Use CSS variables for theming.

---

# Typography

Create a complete typography system.

Styles:

- Display
- H1
- H2
- H3
- H4
- Body Large
- Body
- Small
- Caption
- Label
- Button
- Code

Ensure:

- Excellent readability
- Consistent spacing
- Responsive typography

---

# Layout System

Create reusable layout utilities.

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Define:

- Container widths
- Sidebar width
- Header height
- Section spacing
- Card spacing
- Grid spacing
- Responsive breakpoints

---

# Icon System

Use **Lucide React**.

Create wrapper components.

Icons include:

- Dashboard
- Ticket
- Customer
- AI
- Knowledge Base
- Reports
- Analytics
- Billing
- Settings
- Notifications
- Department
- Tag
- Search
- Filter
- Priority
- Status
- Email
- Chat
- Attachment

Maintain consistent sizing and spacing.

---

# Elevation System

Define elevation levels.

Levels:

- Flat
- Low
- Medium
- High
- Overlay
- Modal
- Dropdown
- Tooltip

Keep shadows subtle.

---

# Animation System

Use **Framer Motion**.

Create reusable animations.

Include:

- Fade In
- Fade Out
- Slide Up
- Slide Down
- Scale
- Page Transition
- Drawer
- Dialog
- Toast
- Hover
- Loading Skeleton
- Button Press

Animations should feel smooth and professional.

---

# Core Components

Build reusable components using shadcn/ui.

## Buttons

- Primary
- Secondary
- Outline
- Ghost
- Destructive
- AI Button
- Icon Button

Support:

- Sizes
- Variants
- Loading
- Disabled

---

## Cards

Create:

- Standard Card
- Dashboard Card
- Statistics Card
- Metric Card
- Feature Card

---

## Navigation

Create:

- Sidebar
- Top Navigation
- Breadcrumb
- Command Palette
- Workspace Switcher
- Organization Switcher
- User Menu

---

## Forms

Components:

- Input
- Textarea
- Select
- Combobox
- Multi Select
- Checkbox
- Radio Group
- Switch
- Date Picker
- Calendar
- File Upload
- Tag Input

Support:

- Validation
- Helper Text
- Loading
- Error
- Success
- Accessibility

---

## Tables

Enterprise-grade table component.

Features:

- Sorting
- Filtering
- Search
- Pagination
- Sticky Header
- Bulk Selection
- Column Visibility
- Expandable Rows
- Loading State
- Empty State
- Row Actions

---

## Feedback Components

Create:

- Alert
- Toast
- Dialog
- Drawer
- Tooltip
- Popover
- Confirmation Dialog
- Progress Bar
- Loading Spinner
- Skeleton

---

# Dashboard Widgets

Create reusable dashboard cards.

Examples:

- Open Tickets
- Assigned To Me
- Waiting For Customer
- Resolved Today
- SLA Status
- AI Usage
- Ticket Trends
- Customer Satisfaction
- Recent Activity
- Recent Tickets
- Team Activity
- Quick Actions

---

# Empty States

Design polished empty states.

Examples:

- No Tickets
- No Customers
- No Knowledge Base
- No Notifications
- No Team Members
- No Search Results

Each should include:

- Illustration Placeholder
- Helpful Message
- Primary Action
- Secondary Action

---

# AI Components

Design dedicated AI components.

Examples:

- AI Badge
- AI Reply Card
- AI Summary Panel
- AI Suggestion Card
- AI Confidence Indicator
- AI Prompt Input
- AI Chat Bubble
- AI Loading Animation
- AI Usage Meter
- AI Generated Label

AI elements should stand out without overwhelming the interface.

---

# Responsive Design

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Requirements:

- No horizontal scrolling
- Touch-friendly controls
- Adaptive layouts
- Responsive typography

---

# Accessibility

Meet WCAG 2.2 AA standards.

Include:

- Keyboard Navigation
- Focus Indicators
- ARIA Labels
- Screen Reader Support
- Accessible Dialogs
- Accessible Forms
- Accessible Tables
- Proper Color Contrast

---

# Performance

Optimize for:

- Small bundle size
- Tree Shaking
- Lazy Loading
- Code Splitting
- Minimal Re-renders
- Fast Initial Load

---

# Folder Structure

Organize components using feature-based architecture.

```text
components/
├── ai/
├── charts/
├── dashboard/
├── feedback/
├── forms/
├── knowledge-base/
├── layout/
├── navigation/
├── providers/
├── tables/
├── theme/
└── ui/
```

---

# Deliverables

Generate:

1. Tailwind CSS Theme
2. CSS Variables
3. Design Tokens
4. Typography System
5. Color Palette
6. Radius System
7. Shadow System
8. Animation Library
9. Icon Library
10. Layout Components
11. Navigation Components
12. Form Components
13. Table Components
14. Dashboard Widgets
15. AI Components
16. Feedback Components
17. Empty States
18. Light Theme
19. Dark Theme
20. Storybook-ready Component Library
21. Component Documentation
22. UI Development Guidelines

---

# Success Criteria

The final design system must:

- Match the Aakasa Digital brand identity
- Be reusable across all future Aakasa Digital products
- Be scalable and maintainable
- Provide a polished enterprise-grade SaaS experience
- Be optimized for performance and accessibility
- Maintain complete visual consistency across SupportCraft AI, BillCraft AI, and future products