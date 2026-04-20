# Data Model

## Purpose

This document reflects the current real data model direction for Nano Syllabus, including the Phase 3 billing and admin foundation.

## Implemented core entities

### Auth user

Account identity is handled by Supabase Auth.

Key app-facing fields:

- `id`
- `email`

## StudentProfile

Academic personalization and access-role data.

Implemented fields:

- `user_id`
- `full_name`
- `college`
- `grade`
- `board_score`
- `subjects[]`
- `target_grade`
- `language_pref`
- `role`
- `created_at`
- `updated_at`

## ChatSession

Implemented fields:

- `id`
- `user_id`
- `title`
- `created_at`
- `updated_at`

## ChatMessage

Implemented fields:

- `id`
- `session_id`
- `role`
- `content`
- `language`
- `grounded`
- `citations`
- `created_at`

## KnowledgeDocument

Implemented fields:

- `id`
- `board`
- `grade`
- `subject`
- `chapter`
- `title`
- `source_name`
- `source_type`
- `uploaded_at`

## KnowledgeChunk

Implemented fields:

- `id`
- `document_id`
- `board`
- `grade`
- `subject`
- `chapter`
- `topic`
- `content`
- `embedding`
- `chunk_index`
- `created_at`

## RevisionNote

Implemented fields:

- `id`
- `user_id`
- `session_id`
- `message_id`
- `title`
- `subject_tag`
- `chapter_tag`
- `annotation`
- `colour_label`
- `created_at`
- `updated_at`

## NoteRevisionLog

Implemented fields:

- `id`
- `note_id`
- `user_id`
- `action`
- `revised_at`

## SubscriptionPlan

Implemented fields:

- `id`
- `name`
- `slug`
- `credits`
- `price`
- `currency`
- `billing_type`
- `is_active`
- `created_at`
- `updated_at`

## UserSubscription

Implemented fields:

- `id`
- `user_id`
- `plan_id`
- `invoice_id`
- `status`
- `starts_at`
- `ends_at`
- `created_at`

## CreditsLedger

Implemented fields:

- `id`
- `user_id`
- `type`
- `amount`
- `balance_after`
- `reference_type`
- `reference_id`
- `description`
- `created_at`

Notes:

- the ledger is now the source of truth for student credit balance
- chat usage writes negative entries only after a successful assistant message is persisted
- starter credits are granted as an initial ledger entry

## Invoice

Implemented fields:

- `id`
- `user_id`
- `plan_id`
- `status`
- `amount`
- `currency`
- `payment_method`
- `created_at`
- `updated_at`

## PaymentSubmission

Implemented fields:

- `id`
- `invoice_id`
- `user_id`
- `reference`
- `proof_meta`
- `status`
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `updated_at`

## Relationship overview

```text
AuthUser 1---1 StudentProfile
AuthUser 1---many ChatSession
ChatSession 1---many ChatMessage
KnowledgeDocument 1---many KnowledgeChunk
AuthUser 1---many RevisionNote
RevisionNote many---1 ChatMessage
RevisionNote many---1 ChatSession
RevisionNote 1---many NoteRevisionLog
AuthUser 1---many CreditsLedger
AuthUser 1---many Invoice
Invoice 1---0..1 PaymentSubmission
AuthUser 1---many UserSubscription
SubscriptionPlan 1---many Invoice
SubscriptionPlan 1---many UserSubscription
```

## Ownership and access rules

Implemented RLS expectations:

- students can access only their own profiles, chats, notes, invoices, payments, subscriptions, and ledger
- authenticated users can read knowledge tables for retrieval
- admins can review finance entities needed for payment operations
- admin approval/rejection paths exist for payment submissions

## Current implementation notes

### Retrieval

- embeddings are stored directly on `knowledge_chunks`
- retrieval is filtered by student context and ranked in the app layer

### Credits

- ledger entries are reference-keyed so chat usage and invoice grants stay traceable
- credits are enforced in chat before new paid usage is allowed

### Billing

- the current payment workflow is manual-verification-first
- automated gateway integration is still deferred

## Planned but not yet implemented

### Richer finance support entities

Planned purpose:

- refunds, disputes, and broader audit tooling

### Broader admin support entities

Planned purpose:

- knowledge operations, user support, and analytics workflows
