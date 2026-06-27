# Phase 3 – Supabase Database Architecture

## Objective

You are a **Senior PostgreSQL Database Architect** and **Supabase Expert**.

Design and implement a **production-ready, enterprise-grade, multi-tenant PostgreSQL database** for **SupportCraft AI**, an AI-powered Help Desk and Customer Support platform developed under **Aakasa Digital**.

This database must be designed to support:

- Millions of tickets
- Thousands of organizations
- Millions of customers
- AI-powered workflows
- Future Aakasa Digital products

The database should follow **Supabase best practices**, PostgreSQL best practices, and be optimized for scalability, security, and maintainability.

---

# Technology Stack

Use:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions
- PostgreSQL Extensions
- SQL Migration Files
- Row Level Security (RLS)
- PostgreSQL Functions
- Database Triggers
- Views
- Materialized Views
- Generated TypeScript Types

**Do NOT use Prisma or any ORM.**

Everything should be implemented using SQL migrations and Supabase-native capabilities.

---

# Architecture Principles

The database must be:

- Multi-tenant
- Secure by default
- Highly scalable
- AI-ready
- Event-driven
- Extensible
- Optimized for analytics
- Optimized for reporting

---

# Multi-Tenant Architecture

Every tenant owns completely isolated data.

Each tenant represents an **Organization**.

All business-related tables **must** include:

```sql
organization_id UUID NOT NULL
```

Every query must be protected using **Row Level Security (RLS)**.

Cross-tenant access must be impossible.

---

# Authentication

Use **Supabase Auth**.

Never duplicate authentication tables.

Create a `profiles` table extending `auth.users`.

## Profiles

Fields:

- id (UUID → auth.users.id)
- full_name
- avatar_url
- email
- phone
- timezone
- locale
- job_title
- created_at
- updated_at

---

# Organizations

Table:

`organizations`

Fields:

- id
- name
- slug
- logo_url
- website
- support_email
- timezone
- country
- primary_color
- business_hours
- created_at
- updated_at

---

# Organization Members

Table:

`organization_members`

Fields:

- id
- organization_id
- user_id
- role
- invited_by
- invited_at
- joined_at

Roles:

- Owner
- Admin
- Agent
- Viewer

A single user may belong to multiple organizations.

---

# Customers

Table:

`customers`

Fields:

- id
- organization_id
- full_name
- email
- phone
- company
- avatar_url
- notes
- preferred_language
- created_at
- updated_at

---

# Departments

Table:

`departments`

Fields:

- id
- organization_id
- name
- description
- display_order

Seed:

- Sales
- Support
- Technical
- Billing
- Customer Success

---

# Ticket Categories

Table:

`ticket_categories`

Examples:

- Bug
- Billing
- Feature Request
- Question
- General
- Incident
- Feedback

Fields:

- id
- organization_id
- name
- color
- icon

---

# Ticket Statuses

Table:

`ticket_statuses`

Seed:

- Open
- In Progress
- Waiting for Customer
- Pending
- Resolved
- Closed
- Spam

Include:

- display_order
- color
- icon

---

# Ticket Priorities

Table:

`ticket_priorities`

Seed:

- Low
- Medium
- High
- Critical

Include:

- color
- display_order

---

# Tickets

Table:

`tickets`

Fields:

- id
- organization_id
- ticket_number
- customer_id
- department_id
- category_id
- assigned_to
- status_id
- priority_id
- subject
- description
- source
- first_response_at
- resolved_at
- closed_at
- last_activity_at
- due_at
- created_at
- updated_at

Ticket Sources:

- Portal
- Email
- Live Chat
- API
- Phone
- WhatsApp
- Facebook
- Instagram
- X (Twitter)

---

# Ticket Messages

Table:

`ticket_messages`

Fields:

- id
- organization_id
- ticket_id
- author_id
- customer_id
- message_type
- body
- is_ai_generated
- created_at

Message Types:

- Public Reply
- Internal Note
- System Event
- AI Suggestion

---

# Ticket Attachments

Use Supabase Storage.

Create bucket:

```
ticket-attachments
```

Metadata table:

`ticket_attachments`

Fields:

- id
- organization_id
- ticket_id
- message_id
- storage_path
- filename
- mime_type
- file_size
- uploaded_by
- created_at

---

# Tags

Table:

`tags`

Fields:

- id
- organization_id
- name
- color

---

# Ticket Tags

Many-to-many relationship.

Table:

`ticket_tags`

---

# Knowledge Base Categories

Table:

`knowledge_base_categories`

Fields:

- id
- organization_id
- name
- slug
- icon

---

# Knowledge Base Articles

Table:

`knowledge_base_articles`

Fields:

- id
- organization_id
- category_id
- author_id
- title
- slug
- summary
- content
- status
- views
- helpful_count
- not_helpful_count
- published_at
- created_at
- updated_at

Status:

- Draft
- Published
- Archived

---

# AI Usage Logs

Table:

`ai_usage_logs`

Track every AI request.

Fields:

- id
- organization_id
- user_id
- ticket_id
- provider
- model
- feature
- prompt_tokens
- completion_tokens
- total_tokens
- estimated_cost
- latency_ms
- success
- created_at

AI Features:

- Reply Generation
- Summarization
- Categorization
- Priority Detection
- Translation
- Sentiment Analysis
- Knowledge Search
- Grammar Improvement

---

# Notifications

Table:

`notifications`

Fields:

- id
- organization_id
- user_id
- title
- message
- type
- read_at
- created_at

---

# Organization Settings

Table:

`organization_settings`

Store using JSONB:

- branding
- email
- ai
- notifications
- sla
- integrations
- business_hours

---

# Audit Logs

Table:

`audit_logs`

Track every important action.

Fields:

- id
- organization_id
- user_id
- action
- entity
- entity_id
- metadata JSONB
- ip_address
- created_at

---

# Billing

Create future-ready tables.

## Plans

- Free
- Basic
- Pro
- Agency

Tables:

- subscription_plans
- subscriptions
- invoices
- payments

Compatible with:

- PayPal
- Stripe

---

# API Keys

Table:

`api_keys`

Fields:

- id
- organization_id
- name
- hashed_key
- last_used_at
- expires_at

---

# Webhooks

Table:

`webhooks`

Fields:

- id
- organization_id
- endpoint
- secret
- enabled

---

# Realtime

Enable Supabase Realtime for:

- Tickets
- Ticket Messages
- Notifications
- Team Presence

---

# Row Level Security

Implement RLS for **every tenant table**.

Requirements:

- Users only access organizations they belong to
- Customers only access their own tickets
- Agents only access tickets inside their organization
- Owners have full organization access

Create reusable helper SQL functions.

---

# PostgreSQL Features

Use:

- UUID Primary Keys
- JSONB
- Generated Columns
- Full Text Search
- GIN Indexes
- Composite Indexes
- Views
- Materialized Views
- Triggers
- Functions
- Check Constraints
- Foreign Keys
- Cascading Deletes where appropriate

---

# Performance Optimization

Create indexes for:

- organization_id
- ticket_number
- customer_id
- assigned_to
- status_id
- priority_id
- category_id
- email
- slug
- created_at
- updated_at
- last_activity_at

Optimize for:

- Fast dashboard queries
- Search performance
- Reporting
- AI analytics

---

# Seed Data

Generate SQL seed scripts for:

- Demo Organization
- Owner User
- Departments
- Ticket Categories
- Priorities
- Statuses
- Customers
- Sample Tickets
- Sample Messages
- Knowledge Base Articles

---

# Database Documentation

Generate:

- ER Diagram (Mermaid)
- Relationship Documentation
- Table Descriptions
- RLS Documentation
- Storage Bucket Documentation
- Index Documentation

---

# Deliverables

Generate:

1. SQL Migration Files
2. Complete Database Schema
3. Row Level Security Policies
4. PostgreSQL Functions
5. Database Triggers
6. Seed Scripts
7. Storage Bucket Definitions
8. Generated TypeScript Types
9. Views
10. Materialized Views
11. Performance Indexes
12. Mermaid ER Diagram
13. Database Documentation
14. Supabase Setup Guide

---

# Success Criteria

The final database architecture should:

- Follow Supabase best practices
- Follow PostgreSQL best practices
- Be fully multi-tenant
- Scale to millions of records
- Be secure by default
- Support AI-powered features
- Be optimized for performance
- Be easy to extend for future Aakasa Digital products
- Require minimal future schema refactoring