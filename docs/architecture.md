# Architecture

## Target architecture

The BRD recommends a multi-part platform:

| Layer | Recommended role |
| --- | --- |
| Student frontend | PWA for chat, profile, notes, billing |
| Admin frontend | Separate admin web app |
| Backend API | auth, chat orchestration, credits, billing, persistence |
| AI gateway | LLM inference with profile-aware prompting |
| Knowledge base | RAG retrieval over syllabus content |
| Database | users, chat, credits, plans, invoices, notes |
| Auth service | JWT and OAuth handling |
| Payments | eSewa, Khalti, Stripe |
| Storage | documents, invoices, uploads |
| Email | OTP, receipts, system emails |
| Analytics | product and revenue instrumentation |

## Recommended stack from the BRD

- student frontend: Next.js PWA + Tailwind CSS
- admin panel: React + Vite + Tailwind CSS
- backend: Node.js with Express or Fastify
- AI: Anthropic Claude or OpenAI GPT family
- vector store: Pinecone or pgvector
- database: PostgreSQL
- auth: Supabase Auth or Auth0
- payments: eSewa, Khalti, Stripe
- object storage: S3 or Cloudflare R2
- email: Resend or SendGrid
- CDN/security: Cloudflare

## AI response flow

The intended production flow is:

1. Student sends a question.
2. Backend loads student profile context.
3. System prompt is composed using academic context.
4. Relevant syllabus chunks are retrieved from the knowledge base.
5. Prompt, retrieval context, chat history, and user message are assembled.
6. LLM generates the answer in the requested language.
7. Response streams back to the frontend.
8. Credit is deducted after successful completion.
9. Conversation is persisted.

## Key data entities

The product will need durable storage for:

- users
- student profiles
- chat sessions
- chat messages
- credits ledger
- subscriptions
- invoices
- knowledge chunks
- prompt templates
- revision notes
- subject tags
- note revision logs

## Current state in this repository

The current app is not yet the target architecture. Right now:

- frontend exists as a student prototype
- auth is mocked in localStorage
- chat is mocked in localStorage
- AI responses are mocked
- notes are stored in localStorage
- invoices are stored in localStorage
- there is no backend API
- there is no real database
- there is no real payment integration
- there is no admin panel app yet
- there is no real RAG pipeline yet

## Architecture gap we need to close

### Current

- single frontend prototype
- local-only state
- demo billing flow
- demo chat responses

### Target

- production student app
- separate admin app
- real backend and database
- real auth and session management
- real AI orchestration with syllabus grounding
- real billing, invoices, and analytics

## Practical implementation direction

Given the current codebase, the best path is:

1. keep the existing student UI as the product shell
2. add a real backend and database behind it
3. replace mock auth and mock storage progressively
4. implement real chat orchestration and RAG
5. then build the admin panel against the same backend

## Suggested repo-level architecture direction

If we continue building in this repo, a clean future structure would be:

```text
apps/
  student-web/
  admin-web/
packages/
  ui/
  config/
  types/
  prompting/
  syllabus-ingestion/
services/
  api/
  workers/
docs/
```

This is not mandatory today, but it is a good target if the project grows past prototype stage.
