# Scope and Requirements

## In scope

The BRD puts the following inside scope for the initial product direction:

- student web application as a PWA
- marketing landing page
- email and Google-based authentication
- student onboarding and profile setup
- bilingual AI chat
- chat history and search
- subject-based explorer
- save as note and revision notes library
- revision mode
- credits system
- plans, subscriptions, invoices, and billing history
- admin panel for operations, content, prompts, users, and finance

## Out of scope for V1

- native iOS app
- native Android app
- video generation
- audio generation
- live tutoring or human-in-the-loop support
- LMS integrations
- collaborative study sessions
- languages beyond English and Roman Nepali

## Student app requirements

### Landing page

Must include:

- hero with strong Nepal-specific value proposition
- features overview
- pricing cards
- testimonials
- FAQ
- clear CTAs
- SEO-friendly metadata
- responsive mobile-first layout

### Authentication

Must support:

- email signup
- OTP verification
- Google OAuth
- forgot password
- persistent auth session
- account deletion and data export

### Onboarding and profile

Must capture:

- college or institution
- grade or academic year
- last board score
- subject preferences
- target grade
- default language preference

This profile context should influence AI behavior.

### AI chat

Must support:

- modern chat UI
- bilingual responses
- per-message language control
- streaming answers
- markdown rendering
- follow-up suggestions
- message feedback
- copy action
- credit deduction visibility

### Chat history

Must support:

- grouped session history
- auto-generated titles
- session restore
- rename
- delete
- history search
- lazy loading for older sessions

### Subject explorer

Must support:

- subject browsing by board, grade, and category
- subject cards with summary context
- subject detail pages listing sessions
- new chat seeded with subject context
- auto-tagging and manual re-tagging

### Notes and revision

Must support:

- save any answer as note
- editable title, subject, topic, annotation, and color label
- notes library with search and filters
- note detail page
- deep-link back to original chat
- follow-up from note context
- revision mode with remember / review outcomes
- revision history per note

### Settings and billing

Must support:

- profile editing
- academic profile editing
- language preference
- notification preferences
- credit usage history
- subscription visibility and management
- billing history and invoices
- account deletion

## Admin panel requirements

The admin app must eventually support:

- role-based admin access
- KPI dashboard
- user management
- knowledge base management
- prompt management
- subscription and plan management
- invoice and finance management
- moderation tools

See [Admin Panel](./admin-panel.md) for the full breakdown.

## Key product rules

### Credit rules

- each successful AI interaction consumes 1 credit
- low-credit warning should appear below 10 credits
- free tier starts with 20 monthly credits
- unused credits do not roll over except where the business explicitly allows it

### Note limits by plan

| Plan | Max saved notes | Revision mode |
| --- | --- | --- |
| Free | 50 | No |
| Basic | 200 | Yes |
| Pro | 500 | Yes + PDF export |
| Unlimited | Unlimited | Yes + PDF export |

### Subscription plans

| Plan | Monthly credits | Price |
| --- | --- | --- |
| Free | 20 | NPR 0 |
| Basic | 200 | NPR 299 |
| Pro | 600 | NPR 699 |
| Unlimited | Unlimited with fair use | NPR 1,299 |

## What matters most for V1

If we need to simplify delivery, these are the highest-priority functional outcomes:

1. real auth
2. real onboarding
3. real syllabus-grounded chat
4. real chat persistence
5. real credits and plan enforcement
6. real notes and revision workflows
7. basic admin tools for content and users

Everything else is important, but these are the foundation.
