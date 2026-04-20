alter table public.student_profiles
  add column if not exists role text not null default 'student';

alter table public.student_profiles
  drop constraint if exists student_profiles_role_check;

alter table public.student_profiles
  add constraint student_profiles_role_check
  check (role in ('student', 'admin'));

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.student_profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
end;
$$;

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  credits integer not null check (credits > 0),
  price integer not null check (price >= 0),
  currency text not null default 'NPR',
  billing_type text not null check (billing_type in ('one_time', 'monthly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  invoice_id uuid,
  status text not null check (status in ('pending', 'active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('grant', 'usage', 'refund', 'adjustment')),
  amount integer not null,
  balance_after integer not null check (balance_after >= 0),
  reference_type text not null check (reference_type in ('starter_grant', 'chat_message', 'invoice', 'manual_adjustment')),
  reference_id text not null,
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists credits_ledger_reference_idx
  on public.credits_ledger(reference_type, reference_id);

create index if not exists credits_ledger_user_created_at_idx
  on public.credits_ledger(user_id, created_at desc);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null check (status in ('pending_payment', 'payment_submitted', 'paid', 'rejected', 'cancelled')),
  amount integer not null check (amount >= 0),
  currency text not null default 'NPR',
  payment_method text not null check (payment_method in ('esewa', 'khalti', 'bank_transfer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null,
  proof_meta jsonb,
  status text not null check (status in ('submitted', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists user_subscriptions_user_id_created_at_idx
  on public.user_subscriptions(user_id, created_at desc);

create index if not exists invoices_user_id_created_at_idx
  on public.invoices(user_id, created_at desc);

create index if not exists payment_submissions_status_submitted_at_idx
  on public.payment_submissions(status, submitted_at desc);

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at
before update on public.subscription_plans
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_payment_submissions_updated_at on public.payment_submissions;
create trigger set_payment_submissions_updated_at
before update on public.payment_submissions
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.credits_ledger enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_submissions enable row level security;

drop policy if exists "student_profiles_select_admin" on public.student_profiles;
create policy "student_profiles_select_admin"
on public.student_profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "subscription_plans_select_authenticated" on public.subscription_plans;
create policy "subscription_plans_select_authenticated"
on public.subscription_plans
for select
to authenticated
using (is_active = true or public.is_admin());

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_subscriptions_select_admin" on public.user_subscriptions;
create policy "user_subscriptions_select_admin"
on public.user_subscriptions
for select
to authenticated
using (public.is_admin());

drop policy if exists "user_subscriptions_insert_admin" on public.user_subscriptions;
create policy "user_subscriptions_insert_admin"
on public.user_subscriptions
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "user_subscriptions_update_admin" on public.user_subscriptions;
create policy "user_subscriptions_update_admin"
on public.user_subscriptions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "credits_ledger_select_own" on public.credits_ledger;
create policy "credits_ledger_select_own"
on public.credits_ledger
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "credits_ledger_select_admin" on public.credits_ledger;
create policy "credits_ledger_select_admin"
on public.credits_ledger
for select
to authenticated
using (public.is_admin());

drop policy if exists "credits_ledger_insert_own" on public.credits_ledger;
create policy "credits_ledger_insert_own"
on public.credits_ledger
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "credits_ledger_insert_admin" on public.credits_ledger;
create policy "credits_ledger_insert_admin"
on public.credits_ledger
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own"
on public.invoices
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "invoices_select_admin" on public.invoices;
create policy "invoices_select_admin"
on public.invoices
for select
to authenticated
using (public.is_admin());

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own"
on public.invoices
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "invoices_update_admin" on public.invoices;
create policy "invoices_update_admin"
on public.invoices
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "payment_submissions_select_own" on public.payment_submissions;
create policy "payment_submissions_select_own"
on public.payment_submissions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "payment_submissions_select_admin" on public.payment_submissions;
create policy "payment_submissions_select_admin"
on public.payment_submissions
for select
to authenticated
using (public.is_admin());

drop policy if exists "payment_submissions_insert_own" on public.payment_submissions;
create policy "payment_submissions_insert_own"
on public.payment_submissions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "payment_submissions_update_admin" on public.payment_submissions;
create policy "payment_submissions_update_admin"
on public.payment_submissions
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.approve_payment_submission(target_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.payment_submissions%rowtype;
  invoice_record public.invoices%rowtype;
  plan_record public.subscription_plans%rowtype;
  current_balance integer := 0;
  next_balance integer := 0;
  computed_end timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve payments.';
  end if;

  select *
  into submission_record
  from public.payment_submissions
  where id = target_submission_id;

  if not found then
    raise exception 'Payment submission not found.';
  end if;

  if submission_record.status <> 'submitted' then
    raise exception 'Payment submission is already finalized.';
  end if;

  select *
  into invoice_record
  from public.invoices
  where id = submission_record.invoice_id;

  if not found then
    raise exception 'Invoice not found.';
  end if;

  select *
  into plan_record
  from public.subscription_plans
  where id = invoice_record.plan_id;

  if not found then
    raise exception 'Plan not found.';
  end if;

  select balance_after
  into current_balance
  from public.credits_ledger
  where user_id = invoice_record.user_id
  order by created_at desc
  limit 1;

  current_balance := coalesce(current_balance, 0);
  next_balance := current_balance + plan_record.credits;

  if plan_record.billing_type = 'monthly' then
    computed_end := now() + interval '30 days';
  else
    computed_end := null;
  end if;

  update public.payment_submissions
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = target_submission_id;

  update public.invoices
  set status = 'paid'
  where id = invoice_record.id;

  insert into public.user_subscriptions (
    user_id,
    plan_id,
    invoice_id,
    status,
    starts_at,
    ends_at
  )
  values (
    invoice_record.user_id,
    plan_record.id,
    invoice_record.id,
    'active',
    now(),
    computed_end
  );

  insert into public.credits_ledger (
    user_id,
    type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description
  )
  values (
    invoice_record.user_id,
    'grant',
    plan_record.credits,
    next_balance,
    'invoice',
    invoice_record.id::text,
    'Credits granted from approved invoice'
  );
end;
$$;

create or replace function public.reject_payment_submission(target_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.payment_submissions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject payments.';
  end if;

  select *
  into submission_record
  from public.payment_submissions
  where id = target_submission_id;

  if not found then
    raise exception 'Payment submission not found.';
  end if;

  if submission_record.status <> 'submitted' then
    raise exception 'Payment submission is already finalized.';
  end if;

  update public.payment_submissions
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = target_submission_id;

  update public.invoices
  set status = 'rejected'
  where id = submission_record.invoice_id;
end;
$$;

insert into public.subscription_plans (name, slug, credits, price, currency, billing_type, is_active)
values
  ('Starter Pack', 'starter-pack', 50, 199, 'NPR', 'one_time', true),
  ('Focus Pack', 'focus-pack', 150, 499, 'NPR', 'one_time', true),
  ('Marathon Pack', 'marathon-pack', 400, 999, 'NPR', 'one_time', true)
on conflict (slug) do nothing;
