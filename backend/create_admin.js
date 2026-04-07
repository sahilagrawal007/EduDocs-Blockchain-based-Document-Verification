require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@edudocs.portal';
  const password = 'Password123!';

  console.log(`Creating Admin User: ${email}`);

  // 1. Create User
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    if (error.message.includes('already exists')) {
        console.log(`User ${email} already exists. Fetching their UUID...`);
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const user = usersData.users.find(u => u.email === email);
        if (user) {
            console.log(`\n\n--- SUCCESS ---\nYour Admin UUID is: ${user.id}\n`);
            console.log(`Now run this in your Supabase SQL Editor:
insert into public.profiles (id, role, first_login_complete)
values ('${user.id}', 'master_admin', true);
            `);
        }
        return;
    }
    console.error('Error creating user:', error.message);
    return;
  }

  const userId = data.user.id;
  console.log(`\n\n--- SUCCESS ---\nSuccessfully created ${email} with password: ${password}`);
  console.log(`Their UUID is: ${userId}\n`);
  
  // Try to insert into profiles automatically, in case they already created the table
  try {
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: userId, role: 'master_admin', first_login_complete: true }
      ]);
      if (profileError) {
          console.log(`Note: The 'profiles' table might not exist yet.`);
          console.log(`Please run the table creation SQL and then this insert query:\n`);
          console.log(`insert into public.profiles (id, role, first_login_complete) values ('${userId}', 'master_admin', true);`);
      } else {
          console.log(`Successfully added the user to the profiles table as master_admin limit!`);
      }
  } catch (e) {
      console.log(`Please run this query manually in Supabase SQL editor:\n`);
      console.log(`insert into public.profiles (id, role, first_login_complete) values ('${userId}', 'master_admin', true);`);
  }
}

createAdmin();
