const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  const email = 'superadmin@edudocs.portal';
  const password = 'SuperPassword123!';

  console.log(`\n======================================================`);
  console.log(`ATTENTION: REQUIRED SUPABASE SQL MIGRATION`);
  console.log(`======================================================`);
  console.log(`Please run the following SQL in your Supabase SQL Editor FIRST:\n`);
  console.log(`
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
`);
  console.log(`======================================================\n`);
  
  console.log(`Creating Super Admin User: ${email}`);

  // 1. Create User
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  let userId;

  if (error) {
    if (error.message.includes('already exists')) {
        console.log(`User ${email} already exists. Fetching their UUID...`);
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === email);
        if (user) {
            userId = user.id;
            console.log(`\n--- SUCCESS ---\nYour Super Admin UUID is: ${userId}`);
        } else {
            console.error('Could not find existing user UUID.');
            return;
        }
    } else {
        console.error('Error creating user:', error.message);
        return;
    }
  } else {
      userId = data.user.id;
      console.log(`\n--- SUCCESS ---\nSuccessfully created ${email} with password: ${password}`);
      console.log(`Their UUID is: ${userId}`);
  }

  // Try to insert into profiles automatically
  try {
      const { error: profileError } = await supabase.from('profiles').upsert([
        { id: userId, role: 'super_admin', first_login_complete: true }
      ], { onConflict: 'id' });
      
      if (profileError) {
          console.log(`\nCould not automatically insert into profiles table.`);
          console.log(`Please run this query manually in Supabase SQL editor:\n`);
          console.log(`insert into public.profiles (id, role, first_login_complete) values ('${userId}', 'super_admin', true) on conflict (id) do update set role = 'super_admin';`);
      } else {
          console.log(`\nSuccessfully added/updated the user in the profiles table as super_admin!`);
      }
  } catch (e) {
      console.log(`\nPlease run this query manually in Supabase SQL editor:\n`);
      console.log(`insert into public.profiles (id, role, first_login_complete) values ('${userId}', 'super_admin', true) on conflict (id) do update set role = 'super_admin';`);
  }
}

createSuperAdmin();
