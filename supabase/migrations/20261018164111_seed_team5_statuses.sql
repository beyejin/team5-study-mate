-- The project already has the normalized issues/statuses/labels schema.
-- Seed the four kanban columns and reusable priority labels used by Team 5.
insert into public.statuses (name, sort_order)
values
  ('Backlog', 1),
  ('Ready', 2),
  ('In Progress', 3),
  ('Done', 4)
on conflict (name) do nothing;

insert into public.labels (name, color)
values
  ('priority:low', '#64748b'),
  ('priority:medium', '#0ea5e9'),
  ('priority:high', '#ef4444')
on conflict (name) do nothing;
