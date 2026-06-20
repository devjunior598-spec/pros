-- Manually insert the missing profile for the user
-- User ID from debug screen: b38d219e-b31e-4e6d-9aee-569ded673826

insert into public.profiles (id, name, full_name, email, role)
values (
  'b38d219e-b31e-4e6d-9aee-569ded673826',
  'Repair User', 
  'Repair User', -- Populating full_name as it is required
  'repaired@example.com', 
  'tenant'
)
on conflict (id) do update
set 
  role = 'tenant',
  full_name = 'Repair User'; -- Ensure full_name is set on update too
