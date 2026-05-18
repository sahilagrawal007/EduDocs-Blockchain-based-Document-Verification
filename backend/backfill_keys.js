const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const HARDHAT_FUNDER_KEY = process.env.HARDHAT_FUNDER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your backend/.env file.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function backfill() {
    console.log("====================================================");
    console.log("🛡️ EduDocs Automatic Private Key Backfiller");
    console.log("====================================================\n");

    try {
        // 1. Fetch all users from Supabase Auth to map emails to profiles
        console.log("Fetching users list from Supabase Auth...");
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;
        
        const emailMap = {};
        usersData.users.forEach(u => {
            emailMap[u.id] = u.email;
        });

        // 2. Fetch all profiles from Supabase database
        console.log("Fetching profiles from database...");
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');
            
        if (profileError) throw profileError;

        const profilesToFix = profiles.filter(p => !p.hardhat_key);

        if (profilesToFix.length === 0) {
            console.log("✅ All profiles already have a hardhat key linked! No backfill needed.");
            return;
        }

        console.log(`Found ${profilesToFix.length} profiles missing a private key.\n`);

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        let funderWallet;
        try {
            funderWallet = new ethers.Wallet(HARDHAT_FUNDER_KEY, provider);
            console.log(`Funder wallet connected: ${funderWallet.address}`);
        } catch(e) {
            console.warn("⚠️ Warning: Could not connect to local Hardhat node or load funder key. Key generation will proceed, but wallets will not be auto-funded.");
        }

        for (const profile of profilesToFix) {
            const email = emailMap[profile.id] || `User (${profile.id})`;
            console.log(`----------------------------------------------------`);
            console.log(`Processing: ${email} [Role: ${profile.role}]`);

            // Generate a secure new random wallet
            const newWallet = ethers.Wallet.createRandom();
            const newKey = newWallet.privateKey;
            const newAddress = newWallet.address;

            console.log(`Old Address: ${profile.blockchain_address || 'None'}`);
            console.log(`New Address: ${newAddress}`);
            console.log(`New Key:     ${newKey}`);

            // Fund the new wallet if Hardhat is online
            if (funderWallet) {
                try {
                    console.log("Sending 10 ETH from funder account...");
                    const tx = await funderWallet.sendTransaction({
                        to: newAddress,
                        value: ethers.utils.parseEther("10.0")
                    });
                    await tx.wait();
                    console.log("Funding successful! ✅");
                } catch(err) {
                    console.error("⚠️ Failed to auto-fund wallet:", err.message);
                }
            }

            // Save key and address to database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    hardhat_key: newKey,
                    blockchain_address: newAddress
                })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`❌ Failed to save new key to database:`, updateError.message);
            } else {
                console.log(`Successfully linked and updated profile in database! 🎉`);
            }
        }

        console.log(`\n====================================================`);
        console.log("✅ Database key backfill completed successfully!");
        console.log("====================================================");

    } catch(err) {
        console.error("❌ Fatal error during backfill:", err.message);
    }
}

backfill();
