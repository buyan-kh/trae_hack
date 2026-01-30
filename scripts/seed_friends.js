const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Parse .env manually to avoid 'dotenv' dependency
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (!fs.existsSync(envPath)) {
            console.warn('Warning: .env file not found at', envPath);
            return {};
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env:', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    // 2. Define users to seed
    // Note: ID generation is tricky if we want them to be valid auth users. 
    // For 'profiles' table, if it's linked to auth.users, we usually need them to exist in auth.
    // HOWEVER, for development/mocking, if the foreign key constraint allows, we can insert into profiles.
    // If 'profiles.id' references 'auth.users.id', we might get a foreign key violation unless we create auth users first.
    // Let's assume for now we can insert into profiles OR we need to check if they exist.
    // Actually, typically 'profiles' triggers 'auth.users'. 
    // If we can't create auth users via client API easily (requires service role usually), 
    // we might just be able to insert into profiles if constraints aren't strict or if we are using a dev setup.

    // Let's try to find existing profiles first by username.
    const usersToSeed = [
        { username: 'buyan', full_name: 'Buyan T', avatar_url: 'https://i.pravatar.cc/150?u=buyan' },
        { username: 'tom', full_name: 'Tom H', avatar_url: 'https://i.pravatar.cc/150?u=tom' },
        { username: 'john', full_name: 'John D', avatar_url: 'https://i.pravatar.cc/150?u=john' },
    ];

    const userIdMap = {};

    for (const u of usersToSeed) {
        // Check if user exists
        let { data: existing } = await supabase.from('profiles').select('id, username').eq('username', u.username).single();

        let userId;

        if (existing) {
            console.log(`User ${u.username} already exists (ID: ${existing.id})`);
            userId = existing.id;
        } else {
            // If we cannot create auth users, we might fail here if profiles.id is FK to auth.users.
            // But let's try inserting with a random UUID if the table allows it, OR just skipping if strict.
            // Ideally we should use admin api to create user, but we only have anon key.
            // We will TRY to insert into profiles. If it fails, we inform user they need to sign up.
            // HACK: Generate a random UUID for the profile (if not using auth.uid())
            // But usually profiles.id IS the auth.uid. 
            // We will try to create a fake ID.
            // CAUTION: This might fail if profiles.id references auth.users(id).

            console.log(`Attempting to create profile for ${u.username}...`);
            // We can't easily create auth users with anon key without signing up.
            // We'll try to signup properly to generate auth user + profile.

            const email = `${u.username}@example.com`;
            const password = 'password123';

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: u.username,
                        full_name: u.full_name,
                        avatar_url: u.avatar_url,
                    }
                }
            });

            if (authError) {
                console.log(`  Error creating auth user for ${u.username}: ${authError.message}`);
                // If User already registered, try to sign in or just fail partially
                if (authError.message.includes('already registered')) {
                    // Try to get the user ID? We can't w/o logging in.
                    // We will skip adding this user if we can't get ID.
                }
            } else if (authData.user) {
                console.log(`  Created auth user for ${u.username} (ID: ${authData.user.id})`);
                userId = authData.user.id;

                // Allow trigger to create profile, wait a bit
                await new Promise(r => setTimeout(r, 1000));

                // Update profile with details just in case trigger didn't catch metadata
                await supabase.from('profiles').upsert({
                    id: userId,
                    username: u.username,
                    full_name: u.full_name,
                    avatar_url: u.avatar_url
                });
            }
        }

        if (userId) {
            userIdMap[u.username] = userId;
        }
    }

    // 3. Create friendships
    // We want Buyan <-> Tom and Buyan <-> John
    const buyanId = userIdMap['buyan'];
    if (!buyanId) {
        console.error('Could not find or create user "buyan". Cannot create friendships.');
        return;
    }

    const friendsToAdd = ['tom', 'john'];

    for (const friendParam of friendsToAdd) {
        const friendId = userIdMap[friendParam];
        if (!friendId) {
            console.warn(`Skipping friendship with ${friendParam} (User ID not found)`);
            continue;
        }

        console.log(`Creating friendship between buyan and ${friendParam}...`);

        // Check for existing friendship
        const { data: existingFriendship, error: fetchError } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${buyanId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${buyanId})`)
            .single();

        if (existingFriendship) {
            console.log(`  Friendship already exists (Status: ${existingFriendship.status})`);
            if (existingFriendship.status !== 'accepted') {
                await supabase.from('friendships').update({ status: 'accepted' }).eq('id', existingFriendship.id);
                console.log('  Updated status to accepted.');
            }
        } else {
            const { error: insertError } = await supabase.from('friendships').insert({
                user_id: buyanId,
                friend_id: friendId,
                status: 'accepted'
            });

            if (insertError) {
                console.error(`  Error creating friendship: ${insertError.message}`);
            } else {
                console.log('  Friendship created!');
            }
        }
    }

    console.log('Seed completed.');
}

seed();
