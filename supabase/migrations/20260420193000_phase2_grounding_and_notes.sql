create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  board text not null,
  grade text not null,
  subject text not null,
  chapter text,
  title text not null,
  source_name text not null,
  source_type text not null,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  board text not null,
  grade text not null,
  subject text not null,
  chapter text,
  topic text,
  content text not null,
  embedding double precision[] not null,
  chunk_index integer not null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_grade_subject_idx
  on public.knowledge_chunks(grade, subject);

create index if not exists knowledge_chunks_document_chunk_idx
  on public.knowledge_chunks(document_id, chunk_index);

alter table public.chat_messages
  add column if not exists grounded boolean not null default false,
  add column if not exists citations jsonb;

create table if not exists public.revision_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  title text not null,
  subject_tag text not null,
  chapter_tag text,
  annotation text,
  colour_label text not null check (colour_label in ('red', 'yellow', 'green')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, message_id)
);

create index if not exists revision_notes_user_id_created_at_idx
  on public.revision_notes(user_id, created_at desc);

create index if not exists revision_notes_session_id_idx
  on public.revision_notes(session_id);

drop trigger if exists set_revision_notes_updated_at on public.revision_notes;
create trigger set_revision_notes_updated_at
before update on public.revision_notes
for each row
execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.note_revision_logs (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.revision_notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('remember', 'review', 'skip')),
  revised_at timestamptz not null default now()
);

create index if not exists note_revision_logs_note_id_revised_at_idx
  on public.note_revision_logs(note_id, revised_at desc);

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.revision_notes enable row level security;
alter table public.note_revision_logs enable row level security;

drop policy if exists "knowledge_documents_select_authenticated" on public.knowledge_documents;
create policy "knowledge_documents_select_authenticated"
on public.knowledge_documents
for select
to authenticated
using (true);

drop policy if exists "knowledge_chunks_select_authenticated" on public.knowledge_chunks;
create policy "knowledge_chunks_select_authenticated"
on public.knowledge_chunks
for select
to authenticated
using (true);

drop policy if exists "revision_notes_select_own" on public.revision_notes;
create policy "revision_notes_select_own"
on public.revision_notes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "revision_notes_insert_own" on public.revision_notes;
create policy "revision_notes_insert_own"
on public.revision_notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "revision_notes_update_own" on public.revision_notes;
create policy "revision_notes_update_own"
on public.revision_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "revision_notes_delete_own" on public.revision_notes;
create policy "revision_notes_delete_own"
on public.revision_notes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "note_revision_logs_select_own" on public.note_revision_logs;
create policy "note_revision_logs_select_own"
on public.note_revision_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "note_revision_logs_insert_own" on public.note_revision_logs;
create policy "note_revision_logs_insert_own"
on public.note_revision_logs
for insert
to authenticated
with check (auth.uid() = user_id);
