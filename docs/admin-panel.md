# Admin Panel

## Why the admin panel exists

The admin panel is the operational backbone of Nano Syllabus. Without it, the student product can launch as a demo, but it cannot scale as a trusted education product.

The admin panel is responsible for:

- keeping syllabus content accurate and current
- managing users and subscriptions
- controlling prompts and AI behavior
- reviewing finance and invoice flows
- monitoring platform health and misuse

## Access model

The admin panel should be a separate protected web app with role-based access.

### Roles

| Capability | Super Admin | Content Admin | Support Admin |
| --- | --- | --- | --- |
| User management | Full | View only | View only |
| Subscription management | Full | No | View only |
| Knowledge base | Full | Full | No |
| Prompt management | Full | Full | No |
| Invoice management | Full | No | View only |
| Analytics dashboard | Full | View only | View only |

### Security expectations

- email and password login only
- mandatory 2FA
- separate protected deployment surface
- auditability for sensitive changes

## Required modules

### Dashboard and analytics

Must show:

- total users
- active users today
- signup trend
- MRR and ARR
- churn
- plan distribution
- total AI queries
- average session length
- top subjects
- credit consumption by plan
- basic system health

### User management

Must support:

- user search and filters
- profile view
- credit adjustments
- account suspension
- password reset support
- subscription history
- payment record inspection
- CSV export

### Knowledge base management

Must support:

- syllabus document upload
- board, grade, subject, chapter, and topic tagging
- chunk browsing and editing
- re-embedding and re-indexing
- version tracking
- retrieval testing

This is especially important because the product's trust depends on academic grounding.

### Prompt management

Must support:

- editing the master system prompt
- context injection rules
- language-specific prompt variants
- prompt testing with mock student profiles
- prompt version history
- rollback
- A/B prompt experiments

### Subscription and plan management

Must support:

- create and edit plans
- deactivate plans
- configure credits and pricing
- manage billing cycles
- promo codes
- cancellation and extension flows
- dunning rules for payment failure

### Invoice and finance management

Must support:

- invoice table with filters
- mark offline or manual payments as paid
- resend invoice emails
- export revenue reports
- VAT configuration

### Content moderation

Must support:

- review flagged AI answers
- inspect limited conversation context
- mark review status
- internal moderation notes
- query blocklists or unsafe-pattern controls

## What is not in this repo yet

There is currently no dedicated admin app in the codebase. This document should be treated as the requirements baseline for that future work.

## Recommended delivery order

1. admin auth and roles
2. user management
3. knowledge base upload and retrieval test tools
4. invoice review and payment verification
5. prompt management
6. analytics and moderation

That order gives operations the minimum leverage needed to support the student product early.
