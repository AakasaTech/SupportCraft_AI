````markdown
# Phase 14 – Billing, Subscriptions & Licensing

## Objective

You are a **Senior SaaS Billing Architect, Payments Engineer, FinTech Solutions Architect, and Full-Stack SaaS Engineer**.

Design and implement a **production-ready Billing, Subscription, Licensing, and Usage Management platform** for **SupportCraft AI**.

The billing platform must support:

- Self-service subscriptions
- Team seat management
- Usage-based billing
- AI usage tracking
- Multiple payment providers
- Trials
- Coupons
- Taxes
- Invoicing
- Subscription lifecycle management

This billing system should become the **shared billing platform** for all **Aakasa Digital** products, including:

- SupportCraft AI
- BillCraft AI
- Future SaaS applications

The architecture must be:

- Multi-tenant
- Secure
- Extensible
- Event-driven
- Provider-agnostic
- Enterprise-ready

---

# Technology Stack

Use:

- Next.js 15
- React 19
- TypeScript
- Supabase
- PostgreSQL
- Supabase Edge Functions
- Tailwind CSS
- shadcn/ui

Payment Providers:

- PayPal (Primary)
- Stripe (Secondary)

Design using a payment abstraction layer.

---

# Architecture

```
Customer

↓

Subscription

↓

Payment Provider

↓

Webhook

↓

Billing Engine

↓

Subscription Engine

↓

Usage Engine

↓

Invoice Engine

↓

Notifications

↓

Reports
```

The UI must never communicate directly with payment providers.

All payment operations should flow through the Billing Service.

---

# Subscription Plans

Support the following plans.

## Free

- 1 Agent
- 50 Tickets / Month
- Community Support
- Basic Knowledge Base

---

## Basic

$9/month

$90/year

Features:

- 2 Agents
- 500 Tickets
- Email Support
- Knowledge Base
- AI Reply Generation
- Customer Portal

---

## Pro

$19/month

$200/year

Features:

- 5 Agents
- 2,500 Tickets
- AI Assistant
- Reports
- Automation
- SLA
- Team Management

---

## Agency

$39/month

$400/year

Features:

- 15 Agents
- 10,000 Tickets
- Advanced AI
- White Label
- Custom Branding
- Priority Support

---

## Enterprise

Custom Pricing

Unlimited resources.

Contact Sales.

---

# Billing Cycle

Support:

Monthly

Quarterly (future)

Yearly

Custom Billing (future)

---

# Free Trial

Support:

7 Days

14 Days

30 Days

Configurable per plan.

Display:

Days Remaining

Trial Expiration

Upgrade CTA

---

# Subscription Lifecycle

Support:

Trial

↓

Active

↓

Past Due

↓

Suspended

↓

Cancelled

↓

Expired

↓

Reactivated

Track all state transitions.

---

# Payment Providers

Implement provider abstraction.

Support:

PayPal

Stripe

Future:

Paddle

Lemon Squeezy

Wise

Bank Transfer

Manual Invoice

---

# Webhooks

Handle provider webhooks.

Examples:

Subscription Created

Subscription Updated

Payment Completed

Payment Failed

Subscription Cancelled

Refund

Chargeback

Dispute

Store all webhook payloads.

---

# Billing Portal

Create a self-service billing portal.

Pages:

Current Plan

Upgrade

Downgrade

Invoices

Payment Methods

Usage

AI Usage

Billing History

Coupons

Taxes

Organization Billing

---

# Subscription Management

Users can:

Upgrade

Downgrade

Cancel

Pause (future)

Resume

Renew

Change Billing Cycle

Preview pricing changes before confirmation.

---

# Team Seat Management

Support:

Included Seats

Used Seats

Available Seats

Purchase Additional Seats

Automatic Seat Validation

Warn when limits exceeded.

---

# Usage Limits

Track:

Tickets

Agents

Organizations (future)

Storage

Knowledge Base Articles

Attachments

AI Requests

AI Tokens

Automation Executions

API Calls

Email Volume

Webhooks

Future Features

---

# Usage Dashboard

Display:

Current Usage

Monthly Usage

Remaining Quota

Estimated Cost

Projected Usage

Limit Warnings

---

# AI Billing

Track:

AI Requests

Prompt Tokens

Completion Tokens

Total Tokens

Estimated Cost

Model Used

Provider Used

Future:

Charge per AI usage.

---

# Coupons

Support:

Percentage Discount

Fixed Amount

Free Trial

Lifetime Discount

Single Use

Expiry Date

Usage Limits

---

# Taxes

Prepare architecture for:

VAT

GST

Sales Tax

Country-specific taxes

Future integrations:

TaxJar

Avalara

---

# Invoices

Generate invoices automatically.

Invoice includes:

Invoice Number

Organization

Billing Address

Plan

Usage

Taxes

Discounts

Total

Payment Status

Due Date

PDF Download

---

# Payment Methods

Support:

PayPal

Credit Card (Stripe)

Future:

Apple Pay

Google Pay

Bank Transfer

Multiple payment methods per organization.

---

# Billing Notifications

Notify customers when:

Trial Ending

Payment Successful

Payment Failed

Invoice Generated

Subscription Renewed

Subscription Cancelled

Usage Limit Reached

AI Budget Exceeded

---

# Billing Analytics

Display:

MRR

ARR

Churn

Active Subscribers

Trial Conversion

Revenue Growth

Plan Distribution

Average Revenue Per Organization

Future:

LTV

CAC

---

# Organization Billing Settings

Manage:

Billing Contact

Billing Address

Tax Number

Currency

Invoice Preferences

Purchase Order Number (future)

---

# Refunds

Support:

Full Refund

Partial Refund

Manual Refund

Automatic Refund (future)

Track refund history.

---

# Currency

Support:

USD (Default)

EUR

GBP

AUD

CAD

Future:

Multi-currency pricing.

---

# Security

Never store:

Credit Card Numbers

CVV

Payment Credentials

Rely entirely on payment providers.

Protect:

Webhook Verification

Replay Attacks

Duplicate Payments

Unauthorized Billing Changes

---

# Permissions

Owner

Admin

Billing Manager (future)

Viewer

Only authorized users may access billing.

---

# Realtime

Update instantly when:

Payment Completed

Subscription Updated

Invoice Generated

Usage Updated

Trial Status Changed

---

# Folder Structure

```text
app/
└── dashboard/
    └── billing/
        ├── overview/
        ├── plans/
        ├── subscriptions/
        ├── invoices/
        ├── usage/
        ├── payment-methods/
        ├── coupons/
        └── settings/

components/
├── billing/
│   ├── plans/
│   ├── subscriptions/
│   ├── invoices/
│   ├── usage/
│   ├── analytics/
│   ├── checkout/
│   └── shared/

lib/
├── billing/
├── subscriptions/
├── payments/
│   ├── providers/
│   ├── paypal/
│   ├── stripe/
│   └── webhooks/
├── invoices/
├── usage/
├── analytics/
└── taxes/
```

---

# Future Enhancements

Design the architecture to support:

- BillCraft AI shared subscriptions
- Unified Aakasa Digital billing
- Bundle discounts
- Marketplace purchases
- Add-on modules
- AI credit purchases
- Enterprise licensing
- Reseller pricing
- Partner billing
- Usage-based pricing
- Metered billing
- Multi-currency pricing
- Procurement systems
- ERP integration
- Accounting integration (QuickBooks, Xero, Zoho Books)

without major architectural changes.

---

# Deliverables

Generate:

1. Billing Architecture
2. Payment Provider Abstraction
3. Subscription Engine
4. Billing Portal
5. Subscription Management
6. Usage Tracking
7. Seat Management
8. AI Usage Billing
9. Invoice Engine
10. Coupon System
11. Tax Framework
12. Payment Method Management
13. Billing Notifications
14. Billing Analytics
15. Webhook Processing
16. Security & Validation
17. Realtime Integration
18. Performance Optimizations
19. Developer Documentation

---

# Success Criteria

The Billing platform should:

- Support PayPal as the primary payment provider with Stripe as a secondary option
- Provide a seamless self-service subscription experience
- Support subscription, seat, and usage-based billing
- Track AI consumption and enforce usage limits
- Generate invoices automatically and securely
- Scale from individual freelancers to enterprise organizations
- Be fully multi-tenant using Supabase Row Level Security
- Integrate seamlessly with Authentication, AI, Reporting, Email, and future Aakasa Digital products
- Serve as the centralized billing and licensing platform for the entire Aakasa Digital ecosystem
- Be production-ready, secure, maintainable, extensible, and enterprise-grade
````
