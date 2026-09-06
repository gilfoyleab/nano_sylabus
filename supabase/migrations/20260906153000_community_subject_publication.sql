-- Community subjects are prepared privately by their creator, then published
-- only after the indexed learning map has been extracted successfully.

alter table public.community_subjects
  add column if not exists publication_status text not null default 'draft',
  add column if not exists published_at timestamptz;

alter table public.community_subjects
  drop constraint if exists community_subjects_publication_status_check;
alter table public.community_subjects
  add constraint community_subjects_publication_status_check
  check (publication_status in ('draft', 'published'));

-- Preserve subjects that already had a usable member challenge map before
-- publication became explicit.
update public.community_subjects
set publication_status = 'published',
    published_at = coalesce(published_at, topic_synced_at, updated_at, timezone('utc'::text, now()))
where status = 'active'
  and topic_sync_status = 'ready'
  and publication_status = 'draft';

create index if not exists community_subjects_member_visibility_idx
  on public.community_subjects (community_id, term_id, position)
  where status = 'active' and publication_status = 'published';

drop policy if exists community_subjects_select_accessible on public.community_subjects;
create policy community_subjects_select_accessible
  on public.community_subjects for select
  using (
    exists (
      select 1 from public.communities community
      where community.id = community_id
        and (
          community.creator_id = auth.uid()
          or (
            community.status = 'active'
            and community_subjects.status = 'active'
            and community_subjects.publication_status = 'published'
            and (
              community.visibility = 'public'
              or exists (
                select 1 from public.community_memberships membership
                where membership.community_id = community.id
                  and membership.user_id = auth.uid()
                  and membership.status = 'active'
              )
            )
          )
        )
    )
  );

drop policy if exists community_subject_topics_select_members on public.community_subject_topics;
create policy community_subject_topics_select_members
  on public.community_subject_topics for select
  using (
    exists (
      select 1 from public.community_subjects subject
      join public.communities community on community.id = subject.community_id
      left join public.community_memberships membership
        on membership.community_id = community.id and membership.user_id = auth.uid()
      where subject.id = community_subject_id
        and subject.status = 'active'
        and (
          community.creator_id = auth.uid()
          or (
            subject.publication_status = 'published'
            and membership.status = 'active'
          )
        )
    )
  );

drop policy if exists community_posts_select_members on public.community_posts;
create policy community_posts_select_members
  on public.community_posts for select
  using (
    exists (
      select 1 from public.community_subjects subject
      join public.communities community on community.id = subject.community_id
      left join public.community_memberships membership
        on membership.community_id = community.id and membership.user_id = auth.uid()
      where subject.id = community_posts.subject_id
        and subject.status = 'active'
        and (
          community.creator_id = auth.uid()
          or (
            subject.publication_status = 'published'
            and membership.status = 'active'
          )
        )
    )
  );
