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

    // Save profile config
    const { error: profileError } = await supabase.from('profiles').insert([
      { 
        id: newUser.user.id, 
        role: role, 
        blockchain_address: address,
        first_login_complete: false
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
    try {
        const wallet = new ethers.Wallet(hardhat_key);
        derivedAddress = wallet.address;
    } catch(e) {
        throw new Error('Invalid hardhat token format.');
    }

    if (derivedAddress.toLowerCase() !== profile.blockchain_address.toLowerCase()) {
        throw new Error('Hardhat token does not match your assigned address.');
    }

    // 4. Update profile to mark first_login_complete
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ first_login_complete: true })
        .eq('id', userId);
        
    if (updateError) throw new Error('Failed to update login status.');

    // Since the frontend needs to handle transactions, it should probably securely save the private key locally
    res.json({ 
        message: 'First login successful', 
        token: userToken, 
        role: profile.role,
        address: derivedAddress
    });

  } catch(error) {
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
            role: profile ? profile.role : 'user' 
        });
    } catch(error) {
        res.status(400).json({ error: error.message });
    }
});

// Issue Certificate Endpoint
app.post('/api/issue', upload.single('document'), async (req, res) => {
    const { credentialText, contractAddress, issuerToken, hardhatKey } = req.body;
    const documentFile = req.file;

    if (!issuerToken || !hardhatKey || !credentialText || !documentFile || !contractAddress) {
        return res.status(400).json({ error: 'Missing parameters. Need credentialText, document, contractAddress, hardhatKey, issuerToken.' });
    }

    try {
        // Verify User is Issuer
        const { data: { user }, error: authError } = await supabase.auth.getUser(issuerToken);
        if (authError || !user) throw new Error('Invalid issuer token');

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'issuer') throw new Error('Unauthorized role. Only issuers can issue documents.');

        // Compute SHA-256 hash of file buffer
        const hash = crypto.createHash('sha256').update(documentFile.buffer).digest('hex');
        const bytes32Hash = "0x" + hash;

        // keccak256 of (email + docHash) to allow multiple documents per user!
        const credentialId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialText + bytes32Hash));

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(hardhatKey, provider);

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
            text: `Hello,\n\nA new document has been issued to you by ${user.email}.\n\nTransaction Hash: ${tx.hash}\nCredential ID: ${credentialId}\n\nPlease find the document attached for your records.`,
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

        // Update local DB
        const fileExt = path.extname(documentFile.originalname || '.pdf');
        const savedFileName = credentialId.slice(0,10) + '_' + Date.now() + fileExt;
        const uploadPath = path.join(__dirname, 'uploads', savedFileName);
        fs.writeFileSync(uploadPath, documentFile.buffer);

        const docRecord = {
            email: credentialText, // recipient
            issuer: user.email, // sender
            credentialId,
            txHash: tx.hash,
            originalName: documentFile.originalname || 'document.pdf',
            savedName: savedFileName,
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

        // Verify role is master_admin
        const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
        if (!adminProfile || adminProfile.role !== 'master_admin') throw new Error('Forbidden');

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
                first_login: prof ? prof.first_login_complete : false
            };
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

        const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
        if (!adminProfile || adminProfile.role !== 'master_admin') throw new Error('Forbidden');

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

        const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', adminUser.id).single();
        if (!adminProfile || adminProfile.role !== 'master_admin') throw new Error('Forbidden');

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

// Provide standard 404
app.use((req, res) => res.status(404).send('Not Found'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
