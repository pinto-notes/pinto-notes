-- The notebook film ("See your month") is offered once per account, not once per device: the
-- device that shows it sets this, and the others don't offer it. Only the person's own app writes
-- it (the profiles policies); nothing else reads it.
alter table public.profiles add column notebook_film_seen_at timestamptz;
