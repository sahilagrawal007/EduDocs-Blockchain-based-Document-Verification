require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer(); // For parsing multipart/form-data

const app = express();
app.use(cors());
app.use(express.json());

// Initialize documents.json if missing
const dbPath = path.join(__dirname, 'documents.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify([]));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const HARDHAT_FUNDER_KEY = process.env.HARDHAT_FUNDER_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0

// We use the service role key to bypass RLS for admin actions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

let transporter;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // 🚀 USE REAL SMTP (LIKE GMAIL)
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log("Real Gmail SMTP account is ready!");
} else {
    // 🧪 USE ETHEREAL MAIL (FOR LOCAL TESTING ONLY)
    (async () => {
        try {
            const account = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
            console.log("Ethereal Mail SMTP testing account is ready!");
        } catch (err) {
            console.error('Failed to create a testing account:', err.message);
        }
    })();
}

// Config for automation
let localConfig = { contractAddress: '' };
try {
    localConfig = require('./config.json');
} catch (e) {
    console.log("No config.json found in backend. Using environment or manual input.");
}

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || localConfig.contractAddress;

function sanitizeAndValidatePrivateKey(key) {
    if (!key || typeof key !== 'string') {
        throw new Error('Private key must be a valid string.');
    }
    let sanitized = key.trim();
    if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
        sanitized = sanitized.slice(1, -1).trim();
    }
    if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
        sanitized = sanitized.slice(1, -1).trim();
    }

    let hex = sanitized.startsWith('0x') ? sanitized.slice(2) : sanitized;

    if (hex.length === 40) {
        throw new Error('You pasted a Blockchain Address (40 characters) instead of a Private Key (64 characters). Please check your welcome credentials and enter the correct private key.');
    }

    if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error('Invalid Private Key length or characters. An Ethereum private key must be exactly 64 hexadecimal characters (66 with "0x").');
    }

    return sanitized.startsWith('0x') ? sanitized : '0x' + sanitized;
}

app.post('/api/auth/create_user', async (req, res) => {
    const { masterAdminToken, email, password, role } = req.body;

    if (!masterAdminToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify master admin
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        // Create new Supabase user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // auto-confirm for simplicity
        });
        if (createError) throw new Error(createError.message);

        // Generate Hardhat Wallet
        const wallet = ethers.Wallet.createRandom();
        const hardhat_key = wallet.privateKey;
        const address = wallet.address;

        // Optional: Fund the wallet if it's an issuer
        if (role === 'issuer') {
            try {
                const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
                const funderWallet = new ethers.Wallet(HARDHAT_FUNDER_KEY, provider);
                const tx = await funderWallet.sendTransaction({
                    to: address,
                    value: ethers.utils.parseEther("1.0")
                });
                await tx.wait();
                console.log(`Funded Issuer ${address} with 1 ETH`);
            } catch (err) {
                console.log("Could not auto-fund wallet (node might be down), proceeding anyway.");
            }
        }

        const { data: adminProfile } = await supabase.from('profiles').select('organization_id').eq('id', adminUser.id).single();
        const orgId = adminProfile ? adminProfile.organization_id : null;

        if (!orgId) {
            throw new Error('Master Admin must belong to an organization to create users.');
        }

        // Save profile config
        const { error: profileError } = await supabase.from('profiles').insert([
            {
                id: newUser.user.id,
                role: role,
                blockchain_address: address,
                hardhat_key: hardhat_key,
                first_login_complete: false,
                organization_id: orgId
            }
        ]);
        if (profileError) throw new Error(profileError.message);

        // Send real email via SMTP
        const mailOptions = {
            from: `"EduDocs Admin" <${process.env.SMTP_USER || 'no-reply@edudocs.test'}>`,
            to: email,
            subject: 'Your EduDocs Account Credentials',
            text: `Welcome! Here are your login details:\n\nEmail: ${email}\nPassword: ${password}\nHasdnet Free Token (Private Key): ${hardhat_key}\n\nYou will need all three to login the first time. Keep your private key safe!`,
        };

        try {
            if (transporter) {
                const info = await transporter.sendMail(mailOptions);
                console.log('\n--- WELCOME EMAIL SENT ---');
                if (nodemailer.getTestMessageUrl(info)) {
                    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
                }
                console.log('------------------\n');
            }
        } catch (mailErr) {
            console.error('Error sending welcome email:', mailErr);
        }

        res.json({
            message: 'User created successfully.',
            credentials: {
                email: email,
                password: password,
                hardhat_key: hardhat_key
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/bulk_create_users', async (req, res) => {
    const { masterAdminToken, emails, role } = req.body;

    if (!masterAdminToken || !emails || !Array.isArray(emails) || !role) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // 1. Verify master admin or super admin
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        const { data: adminProfile } = await supabase.from('profiles').select('organization_id, role').eq('id', adminUser.id).single();
        if (!adminProfile || (adminProfile.role !== 'master_admin' && adminProfile.role !== 'super_admin')) {
            throw new Error('Unauthorized role. Only administrators can import users.');
        }
        const orgId = adminProfile ? adminProfile.organization_id : null;
        if (!orgId) {
            throw new Error('Admin must belong to an organization to import users.');
        }

        const results = { success: [], errors: [] };

        // 2. Loop and create each user
        for (const rawEmail of emails) {
            const email = rawEmail.trim().toLowerCase();
            if (!email || !email.includes('@')) {
                results.errors.push({ email, error: 'Invalid email address' });
                continue;
            }

            try {
                // Generate automatic secure random password (8 chars random + suffix)
                const password = crypto.randomBytes(6).toString('hex') + 'Edu!1';

                // Create Supabase user
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true
                });
                if (createError) throw new Error(createError.message);

                // Generate Hardhat Wallet
                const wallet = ethers.Wallet.createRandom();
                const hardhat_key = wallet.privateKey;
                const address = wallet.address;

                // Optional: Fund the wallet if it's an issuer
                if (role === 'issuer') {
                    try {
                        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
                        const funderWallet = new ethers.Wallet(HARDHAT_FUNDER_KEY, provider);
                        const tx = await funderWallet.sendTransaction({
                            to: address,
                            value: ethers.utils.parseEther("1.0")
                        });
                        await tx.wait();
                    } catch (err) {
                        console.log("Could not auto-fund wallet (node might be down), proceeding anyway.");
                    }
                }

                // Save profile config
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: newUser.user.id,
                        role: role,
                        blockchain_address: address,
                        hardhat_key: hardhat_key,
                        first_login_complete: false,
                        organization_id: orgId
                    }
                ]);
                if (profileError) throw new Error(profileError.message);

                // Send real email via SMTP welcome details
                const mailOptions = {
                    from: `"EduDocs Admin" <${process.env.SMTP_USER || 'no-reply@edudocs.test'}>`,
                    to: email,
                    subject: 'Your EduDocs Account Credentials Ready',
                    text: `Welcome! An administrator has created an account for you on the EduDocs Platform.\n\nHere are your first-time login credentials:\n\nEmail: ${email}\nPassword: ${password}\nHasdnet Free Token (Private Key): ${hardhat_key}\n\nYou will need all three to login the first time. Keep your private key safe!`,
                };

                try {
                    if (transporter) {
                        await transporter.sendMail(mailOptions);
                    }
                } catch (mailErr) {
                    console.error('Error sending welcome email:', mailErr);
                }

                results.success.push({ email, address });
            } catch (singleErr) {
                results.errors.push({ email, error: singleErr.message });
            }
        }

        res.json({
            message: `Bulk import completed. Created: ${results.success.length}, Failed: ${results.errors.length}`,
            results
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Custom first login
app.post('/api/auth/first_login', async (req, res) => {
    const { email, password, hardhat_key } = req.body;
    if (!email || !password || !hardhat_key) {
        return res.status(400).json({ error: 'Email, password, and hardhat token are required for first login' });
    }

    try {
        // 1. Sign in via Supabase for credentials check
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (authError) throw new Error(authError.message);

        const userToken = authData.session.access_token;
        const userId = authData.user.id;

        // 2. Look up profile
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) throw new Error('Profile not found.');

        if (profile.first_login_complete) {
            return res.status(400).json({ error: 'First login already completed. Use regular login.' });
        }

        // 3. Verify hardhat key matches the assigned address
        let derivedAddress;
        let validatedKey;
        try {
            validatedKey = sanitizeAndValidatePrivateKey(hardhat_key);
            const wallet = new ethers.Wallet(validatedKey);
            derivedAddress = wallet.address;
        } catch (e) {
            throw new Error(e.message || 'Invalid hardhat token format.');
        }

        if (derivedAddress.toLowerCase() !== profile.blockchain_address.toLowerCase()) {
            throw new Error('Hardhat token does not match your assigned address.');
        }

        // 4. Update profile to mark first_login_complete and store hardhat_key
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ first_login_complete: true, hardhat_key: validatedKey })
            .eq('id', userId);

        if (updateError) throw new Error('Failed to update login status.');

        // Since the frontend needs to handle transactions, it should probably securely save the private key locally
        res.json({
            message: 'First login successful',
            token: userToken,
            role: profile.role,
            address: derivedAddress,
            hardhatKey: validatedKey
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Regular Login Helper to check if they completed first login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (authError) throw new Error(authError.message);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profile && !profile.first_login_complete) {
            throw new Error('Please complete your first-time login using your hardhat free token.');
        }

        res.json({
            token: authData.session.access_token,
            role: profile ? profile.role : 'user',
            hardhatKey: profile ? profile.hardhat_key : null
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Issue Certificate Endpoint
app.post('/api/issue', upload.single('document'), async (req, res) => {
    const { credentialText, contractAddress, issuerToken } = req.body;
    let { hardhatKey } = req.body;
    const documentFile = req.file;

    if (!issuerToken || !credentialText || !contractAddress) {
        return res.status(400).json({ error: 'Missing parameters. Need credentialText, contractAddress, issuerToken, document.' });
    }

    try {
        // Verify User is Issuer
        const { data: { user }, error: authError } = await supabase.auth.getUser(issuerToken);
        if (authError || !user) throw new Error('Invalid issuer token');

        const { data: profile } = await supabase.from('profiles').select('role, hardhat_key').eq('id', user.id).single();
        if (!profile || profile.role !== 'issuer') throw new Error('Unauthorized role. Only issuers can issue documents.');

        const finalHardhatKey = hardhatKey || (profile ? profile.hardhat_key : null);
        if (!finalHardhatKey) {
            return res.status(400).json({ error: 'Missing hardhatKey. Please make sure the hardhat free token is configured for your account.' });
        }

        let validatedKey;
        try {
            validatedKey = sanitizeAndValidatePrivateKey(finalHardhatKey);
        } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        // Compute SHA-256 hash of file buffer
        const hash = crypto.createHash('sha256').update(documentFile.buffer).digest('hex');
        const bytes32Hash = "0x" + hash;

        // keccak256 of (email + docHash) to allow multiple documents per user!
        const credentialId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialText + bytes32Hash));

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(validatedKey, provider);

        // --- SELF-HEALING (IF HARDHAT RESTARTED) ---
        // 1. Ensure issuer has ETH
        const balance = await provider.getBalance(wallet.address);
        if (balance.lt(ethers.utils.parseEther("0.1"))) {
            console.log(`Auto-funding ${wallet.address} because Hardhat probably restarted...`);
            const funderWallet = new ethers.Wallet(HARDHAT_FUNDER_KEY, provider);
            const fundTx = await funderWallet.sendTransaction({
                to: wallet.address,
                value: ethers.utils.parseEther("1.0")
            });
            await fundTx.wait();
        }

        // 2. Ensure issuer is registered in the contract
        const abi = [
            "function issueCertificate(bytes32 credentialId, bytes32 docHash) external",
            "function registerIssuer() external",
            "function registeredIssuer(address) external view returns (bool)"
        ];
        const contract = new ethers.Contract(contractAddress, abi, wallet);

        const isRegistered = await contract.registeredIssuer(wallet.address);
        if (!isRegistered) {
            console.log(`Auto-registering ${wallet.address} as an issuer...`);
            const regTx = await contract.registerIssuer();
            await regTx.wait();
        }
        // -------------------------------------------

        const tx = await contract.issueCertificate(credentialId, bytes32Hash);
        await tx.wait();

        // Send email with the issued document
        const recipientEmail = credentialText.trim().toLowerCase();
        const mailOptions = {
            from: `"EduDocs Document Service" <${process.env.SMTP_USER || 'no-reply@edudocs.test'}>`,
            replyTo: user.email,
            to: recipientEmail, // Recipient email
            cc: user.email, // Also send a copy to the issuer for their records
            subject: `[EduDocs] New Document Issued to ${recipientEmail}`,
            text: `Hello,\n\nA new document has been issued to you by ${user.email}.\n\nTransaction Hash: ${tx.hash}\nCredential ID: ${credentialId}\nDocument Hash: ${bytes32Hash}\n\nPlease find the document attached for your records.`,
            attachments: [
                {
                    filename: documentFile.originalname || 'issued_document.pdf',
                    content: documentFile.buffer
                }
            ]
        };

        try {
            if (transporter) {
                const info = await transporter.sendMail(mailOptions);
                console.log('\n--- DOCUMENT EMAIL SENT ---');
                console.log(`To: ${recipientEmail}, CC: ${user.email}`);
                if (nodemailer.getTestMessageUrl && info && nodemailer.getTestMessageUrl(info)) {
                    console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
                }
                console.log('---------------------------\n');
            }
        } catch (mailErr) {
            console.error('Failed to send document email:', mailErr);
        }

        // Upload to Cloudinary
        const uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "edudocs",
                        resource_type: "image", // PDFs are delivered via the image pipeline in Cloudinary!
                        public_id: credentialId.slice(0, 10) + '_' + Date.now()
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
            });
        };

        const cloudinaryResult = await uploadFromBuffer(req);
        const documentUrl = cloudinaryResult.secure_url;

        const docRecord = {
            email: credentialText, // recipient
            issuer: user.email, // sender
            credentialId,
            txHash: tx.hash,
            originalName: documentFile.originalname || 'document.pdf',
            savedName: documentFile.originalname || 'document.pdf',
            documentUrl: documentUrl,
            docHash: bytes32Hash,
            issuedAt: Date.now()
        };
        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        allDocs.push(docRecord);
        fs.writeFileSync(dbPath, JSON.stringify(allDocs, null, 2));

        res.json({ success: true, transactionHash: tx.hash, credentialId, docHash: bytes32Hash });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Revoke Certificate Endpoint
app.post('/api/revoke', async (req, res) => {
    const { credentialId, contractAddress, issuerToken } = req.body;
    let { hardhatKey } = req.body;

    if (!issuerToken || !credentialId || !contractAddress) {
        return res.status(400).json({ error: 'Missing parameters. Need credentialId, contractAddress, issuerToken.' });
    }

    try {
        // Verify User is Issuer
        const { data: { user }, error: authError } = await supabase.auth.getUser(issuerToken);
        if (authError || !user) throw new Error('Invalid issuer token');

        const { data: profile } = await supabase.from('profiles').select('role, hardhat_key').eq('id', user.id).single();
        if (!profile || profile.role !== 'issuer') throw new Error('Unauthorized role. Only issuers can revoke documents.');

        const finalHardhatKey = hardhatKey || (profile ? profile.hardhat_key : null);
        if (!finalHardhatKey) {
            return res.status(400).json({ error: 'Missing hardhatKey. Please make sure the hardhat free token is configured for your account.' });
        }

        let validatedKey;
        try {
            validatedKey = sanitizeAndValidatePrivateKey(finalHardhatKey);
        } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(validatedKey, provider);

        const abi = [
            "function revokeCertificate(bytes32 credentialId) external"
        ];
        const contract = new ethers.Contract(contractAddress, abi, wallet);

        let txHash = 'N/A (Blockchain state reset)';
        try {
            const tx = await contract.revokeCertificate(credentialId);
            await tx.wait();
            txHash = tx.hash;
        } catch (contractError) {
            // If the Hardhat node was restarted, the contract state is wiped.
            // It will throw "not issued". We should still mark it as revoked locally.
            if (contractError.message.includes('not issued')) {
                console.log('Contract threw "not issued", likely due to Hardhat restart. Force revoking locally.');
            } else {
                throw contractError;
            }
        }

        // Update local DB to reflect revocation (optional, but good for local record)
        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        const docIndex = allDocs.findIndex(d => d.credentialId === credentialId);
        if (docIndex !== -1) {
            allDocs[docIndex].revoked = true;
            fs.writeFileSync(dbPath, JSON.stringify(allDocs, null, 2));
        }

        res.json({ success: true, transactionHash: txHash, credentialId });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint for normal users to fetch documents
app.get('/api/my-documents', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid token');

        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        const userDocs = allDocs.filter(d => d.email.toLowerCase() === user.email.toLowerCase());
        res.json({ documents: userDocs });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint for issuers to fetch documents they issued
app.get('/api/issued-documents', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid token');

        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        const issuedDocs = allDocs.filter(d => d.issuer.toLowerCase() === user.email.toLowerCase());
        res.json({ documents: issuedDocs });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Endpoint for issuers (or anyone) to verify a document
app.post('/api/verify', upload.single('document'), async (req, res) => {
    const { credentialText, contractAddress } = req.body;
    const documentFile = req.file;

    if (!credentialText || !contractAddress || !documentFile) {
        return res.status(400).json({ error: 'Missing parameters. Need credentialText, document, contractAddress.' });
    }

    try {
        const hash = crypto.createHash('sha256').update(documentFile.buffer).digest('hex');
        const computedHash = "0x" + hash;

        // Use exact same logic to compute credentialId (email + docHash)
        const credentialId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialText + computedHash));

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const abi = [
            "function certificates(bytes32) external view returns (address issuer, bytes32 docHash, uint256 issuedAt, bool revoked)"
        ];
        const contract = new ethers.Contract(contractAddress, abi, provider);

        const cert = await contract.certificates(credentialId);
        if (cert.issuedAt.eq(0)) {
            return res.json({ verified: false, message: 'Document completely missing or not issued yet.' });
        }
        if (cert.revoked) {
            return res.json({ verified: false, message: 'Document was revoked by issuer.' });
        }
        if (cert.docHash !== computedHash) {
            return res.json({ verified: false, message: 'Cryptographic hash mismatch! This file was tampered with.' });
        }

        res.json({
            verified: true,
            message: 'Document is 100% authentic and unaltered.',
            issuer: cert.issuer,
            issuedAt: new Date(cert.issuedAt.toNumber() * 1000).toLocaleString()
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- ADMIN USER MANAGEMENT ENDPOINTS ---

app.get('/api/users', async (req, res) => {
    const { masterAdminToken } = req.query;
    if (!masterAdminToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        // Verify role is master_admin or super_admin
        const { data: adminProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', adminUser.id).single();
        if (!adminProfile || (adminProfile.role !== 'master_admin' && adminProfile.role !== 'super_admin')) throw new Error('Forbidden');

        // Get all users from Auth
        const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw new Error(usersError.message);

        // Get all profiles
        const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
        if (profError) throw new Error(profError.message);

        const usersList = authUsers.users.map(u => {
            const prof = profiles.find(p => p.id === u.id);
            return {
                id: u.id,
                email: u.email,
                role: prof ? prof.role : 'unknown',
                first_login: prof ? prof.first_login_complete : false,
                organization_id: prof ? prof.organization_id : null
            };
        }).filter(u => {
            if (adminProfile.role === 'super_admin') return true;
            return u.organization_id === adminProfile.organization_id;
        });

        res.json({ users: usersList });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { masterAdminToken } = req.body;
    const userId = req.params.id;

    if (!masterAdminToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        const { data: adminProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', adminUser.id).single();
        if (!adminProfile || (adminProfile.role !== 'master_admin' && adminProfile.role !== 'super_admin')) throw new Error('Forbidden');

        // Tenant Isolation: If not super admin, check if user belongs to the same org
        if (adminProfile.role !== 'super_admin') {
            const { data: targetProfile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
            if (!targetProfile || targetProfile.organization_id !== adminProfile.organization_id) {
                throw new Error('Forbidden: Cannot modify a user from a different organization.');
            }
        }

        // Delete profile and then user
        await supabase.from('profiles').delete().eq('id', userId);
        const { error: delError } = await supabase.auth.admin.deleteUser(userId);
        if (delError) throw new Error(delError.message);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    const { masterAdminToken, newPassword } = req.body;
    const userId = req.params.id;

    if (!masterAdminToken || !newPassword) return res.status(400).json({ error: 'Missing token or password' });

    try {
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        const { data: adminProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', adminUser.id).single();
        if (!adminProfile || (adminProfile.role !== 'master_admin' && adminProfile.role !== 'super_admin')) throw new Error('Forbidden');

        // Tenant Isolation: If not super admin, check if user belongs to the same org
        if (adminProfile.role !== 'super_admin') {
            const { data: targetProfile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
            if (!targetProfile || targetProfile.organization_id !== adminProfile.organization_id) {
                throw new Error('Forbidden: Cannot modify a user from a different organization.');
            }
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (updateError) throw new Error(updateError.message);

        // Fetch user email to send notification
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        if (userEmail && transporter) {
            const mailOptions = {
                from: `"EduDocs Security" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: 'Security Alert: Password Updated',
                text: `Hello,\n\nYour password for EduDocs has been updated by an administrator.\n\nYour new password is: ${newPassword}\n\nPlease login and change it if necessary.`,
            };
            try {
                await transporter.sendMail(mailOptions);
                console.log(`Password update email sent to ${userEmail}`);
            } catch (err) {
                console.error('Failed to send password update email:', err);
            }
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- SUPER ADMIN ENDPOINTS ---

app.post('/api/organizations', async (req, res) => {
    const { token, name } = req.body;
    if (!token || !name) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
        if (verifyError || !user) throw new Error('Invalid token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'super_admin') throw new Error('Forbidden: Super Admin only');

        const { data, error } = await supabase.from('organizations').insert([{ name }]).select();
        if (error) throw new Error(error.message);

        res.json({ message: 'Organization created successfully', organization: data[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/organizations', async (req, res) => {
    const { token } = req.query;
    try {
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
        if (verifyError || !user) throw new Error('Invalid token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'super_admin') throw new Error('Forbidden: Super Admin only');

        const { data, error } = await supabase.from('organizations').select('*');
        if (error) throw new Error(error.message);

        res.json({ organizations: data || [] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/create_master_admin', async (req, res) => {
    const { token, email, password, organization_id } = req.body;
    try {
        if (!organization_id) throw new Error('Organization ID is required to create a Master Admin.');

        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(token);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
        if (!profile || profile.role !== 'super_admin') throw new Error('Forbidden: Super Admin only');

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true
        });
        if (createError) throw new Error(createError.message);

        const { error: profileError } = await supabase.from('profiles').insert([
            { id: newUser.user.id, role: 'master_admin', first_login_complete: true, organization_id }
        ]);
        if (profileError) throw new Error(profileError.message);

        res.json({ message: 'Master Admin created successfully.', credentials: { email, password } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/analytics/system', async (req, res) => {
    const { token } = req.query;
    try {
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
        if (verifyError || !user) throw new Error('Invalid token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'super_admin') throw new Error('Forbidden: Super Admin only');

        const { data: orgs } = await supabase.from('organizations').select('*');
        const { data: profilesData } = await supabase.from('profiles').select('*');
        const { data: authUsers } = await supabase.auth.admin.listUsers();

        const masterAdmins = profilesData ? profilesData.filter(p => p.role === 'master_admin').length : 0;
        const issuers = profilesData ? profilesData.filter(p => p.role === 'issuer').length : 0;
        const normalUsers = profilesData ? profilesData.filter(p => p.role === 'user').length : 0;

        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        const totalDocs = allDocs.length;

        // Build organization breakdown
        const orgsBreakdown = [];
        if (orgs && profilesData) {
            for (const org of orgs) {
                const orgProfiles = profilesData.filter(p => p.organization_id === org.id);
                const orgMasterAdmins = orgProfiles.filter(p => p.role === 'master_admin').length;
                const orgIssuers = orgProfiles.filter(p => p.role === 'issuer').length;
                const orgNormalUsers = orgProfiles.filter(p => p.role === 'user').length;

                // Find issuer emails in this org
                const orgIssuerEmails = authUsers ? authUsers.users
                    .filter(u => {
                        const prof = orgProfiles.find(p => p.id === u.id);
                        return prof && prof.role === 'issuer';
                    })
                    .map(u => u.email.toLowerCase()) : [];

                // Filter docs issued by these issuers
                const orgDocs = allDocs.filter(d => d.issuer && orgIssuerEmails.includes(d.issuer.toLowerCase())).length;

                orgsBreakdown.push({
                    id: org.id,
                    name: org.name,
                    masterAdmins: orgMasterAdmins,
                    issuers: orgIssuers,
                    users: orgNormalUsers,
                    documentsCount: orgDocs
                });
            }
        }

        res.json({
            stats: {
                totalOrganizations: orgs ? orgs.length : 0,
                totalMasterAdmins: masterAdmins,
                totalIssuers: issuers,
                totalUsers: normalUsers,
                totalDocuments: totalDocs,
                organizationsBreakdown: orgsBreakdown
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/analytics/organization/:id', async (req, res) => {
    const { token } = req.query;
    const orgId = req.params.id;
    try {
        const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);
        if (verifyError || !user) throw new Error('Invalid token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'super_admin') throw new Error('Forbidden: Super Admin only');

        // Fetch all users and profiles to match email to organization
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const { data: profilesData } = await supabase.from('profiles').select('*');

        const orgProfiles = profilesData ? profilesData.filter(p => p.organization_id === orgId) : [];
        const masterAdmins = orgProfiles.filter(p => p.role === 'master_admin').length;
        const issuers = orgProfiles.filter(p => p.role === 'issuer').length;
        const normalUsers = orgProfiles.filter(p => p.role === 'user').length;

        // Map issuer emails in this org
        const orgIssuerEmails = authUsers ? authUsers.users
            .filter(u => {
                const prof = orgProfiles.find(p => p.id === u.id);
                return prof && prof.role === 'issuer';
            })
            .map(u => u.email.toLowerCase()) : [];

        // Filter documents issued by these issuers
        const allDocs = JSON.parse(fs.readFileSync(dbPath));
        const orgDocsArray = allDocs.filter(d => d.issuer && orgIssuerEmails.includes(d.issuer.toLowerCase()));

        // Build last 7 days activity trend
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() - i);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const count = orgDocsArray.filter(d => {
                if (!d.issuedAt) return false;
                const docDate = new Date(d.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return docDate === dateStr;
            }).length;

            trend.push({ date: dateStr, count });
        }

        res.json({
            stats: {
                totalMasterAdmins: masterAdmins,
                totalIssuers: issuers,
                totalUsers: normalUsers,
                totalDocuments: orgDocsArray.length,
                activityTrend: trend
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { masterAdminToken, email, password, role, organization_id } = req.body;
    const userId = req.params.id;

    if (!masterAdminToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data: { user: adminUser }, error: verifyError } = await supabase.auth.getUser(masterAdminToken);
        if (verifyError || !adminUser) throw new Error('Invalid token');

        const { data: adminProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', adminUser.id).single();
        if (!adminProfile || (adminProfile.role !== 'master_admin' && adminProfile.role !== 'super_admin')) throw new Error('Forbidden');

        // Tenant Isolation: If not super admin, check if user belongs to the same org
        if (adminProfile.role !== 'super_admin') {
            const { data: targetProfile } = await supabase.from('profiles').select('organization_id').eq('id', userId).single();
            if (!targetProfile || targetProfile.organization_id !== adminProfile.organization_id) {
                throw new Error('Forbidden: Cannot modify a user from a different organization.');
            }
        }

        // Update auth user if password or email is provided
        const updateData = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, updateData);
            if (updateError) throw new Error(updateError.message);
        }

        // Update profile role / organization if provided
        const profileUpdates = {};
        if (role) profileUpdates.role = role;
        if (organization_id !== undefined) profileUpdates.organization_id = organization_id;

        if (Object.keys(profileUpdates).length > 0) {
            const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', userId);
            if (profileError) throw new Error(profileError.message);
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update own blockchain hardhat key
app.put('/api/profile/hardhat-key', async (req, res) => {
    const { token, hardhatKey } = req.body;
    if (!token || !hardhatKey) {
        return res.status(400).json({ error: 'Token and hardhatKey are required.' });
    }

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid user token.');

        // Verify hardhat key format and that it matches the blockchain address in the profile
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile) throw new Error('Profile not found.');

        let derivedAddress;
        let validatedKey;
        try {
            validatedKey = sanitizeAndValidatePrivateKey(hardhatKey);
            const wallet = new ethers.Wallet(validatedKey);
            derivedAddress = wallet.address;
        } catch (e) {
            throw new Error(e.message || 'Invalid hardhat token format.');
        }

        if (derivedAddress.toLowerCase() !== profile.blockchain_address.toLowerCase()) {
            throw new Error('Hardhat token does not match your assigned address.');
        }

        // Save key to the database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ hardhat_key: validatedKey })
            .eq('id', user.id);

        if (updateError) throw new Error('Failed to save hardhat key.');

        res.json({ success: true, message: 'Hardhat key successfully linked to your profile!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Retrieve active session details securely
app.post('/api/auth/session', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Session expired or invalid token.');

        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile) throw new Error('Profile not found.');

        res.json({
            email: user.email,
            role: profile.role,
            hardhatKey: profile.hardhat_key
        });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

// Provide standard 404
app.use((req, res) => res.status(404).send('Not Found'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});

// Triggering restart for Cloudinary!
