const { spawn, execSync } = require('child_process');
const path = require('path');

// ── Configuration ─────────────────────────────────────────────────────────────
const RPC_URL     = 'http://127.0.0.1:8545';
const BACKEND_DIR = path.join(__dirname, 'backend');
const UI_DIR      = path.join(__dirname, 'verifier-ui');

// Run hardhat via `node <cli.js>` — bypasses all .cmd/.sh shim issues on Windows
// Works regardless of spaces in the path (we pass as separate spawn args, no shell needed)
const HARDHAT_CLI = path.join(__dirname, 'node_modules', 'hardhat', 'internal', 'cli', 'cli.js');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function isNodeRunning() {
    try {
        const res = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
        });
        return res.status === 200;
    } catch { return false; }
}

/**
 * Spawn hardhat via `node hardhat/cli.js <args>` — no shell, no .cmd issues.
 */
function spawnHardhat(args, name) {
    console.log(`[${name}] $ node hardhat/cli.js ${args.join(' ')}`);
    const proc = spawn(process.execPath, [HARDHAT_CLI, ...args], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: false,
    });
    proc.on('close', code => console.log(`[${name}] exited (${code})`));
    return proc;
}

/**
 * Run an npm script — npm is always on PATH, shell:true is safe here.
 */
function runNpm(script, cwd, name) {
    console.log(`[${name}] $ npm run ${script}`);
    const proc = spawn('npm', ['run', script], { cwd, stdio: 'inherit', shell: true });
    proc.on('close', code => console.log(`[${name}] exited (${code})`));
    return proc;
}

/**
 * Sync deploy step — also uses node directly to avoid .cmd issues.
 */
function deployContract() {
    console.log('$ node hardhat/cli.js run --network localhost scripts/deploy.js');
    execSync(
        `"${process.execPath}" "${HARDHAT_CLI}" run --network localhost scripts/deploy.js`,
        { stdio: 'inherit', cwd: __dirname }
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function start() {
    console.log('\n--- EduDocs Automated Dev Startup ---\n');

    // Sanity check: hardhat must be installed
    const fs = require('fs');
    if (!fs.existsSync(HARDHAT_CLI)) {
        console.error(`Hardhat not found at: ${HARDHAT_CLI}`);
        console.error('Please run: npm install  (in the project root)');
        process.exit(1);
    }

    // 1. Start Hardhat Node
    if (!(await isNodeRunning())) {
        console.log('Hardhat node not detected. Starting...');
        spawnHardhat(['node'], 'Blockchain');

        console.log('Waiting for blockchain node (may take ~15s)...');
        let waited = 0;
        while (!(await isNodeRunning())) {
            await new Promise(r => setTimeout(r, 1000));
            if (++waited % 5 === 0) console.log(`  ... ${waited}s`);
            if (waited > 90) {
                console.error('\nBlockchain node did not start in time. Aborting.');
                process.exit(1);
            }
        }
        console.log('✓ Blockchain node ready!\n');
    } else {
        console.log('✓ Hardhat node already running.\n');
    }

    // 2. Deploy Smart Contract
    console.log('Deploying smart contract...');
    try {
        deployContract();
        console.log('✓ Contract deployed & configs synced!\n');
    } catch (e) {
        console.error('Deployment failed (continuing anyway).\n');
    }

    // 3. Start Backend
    runNpm('dev', BACKEND_DIR, 'Backend');

    // Small gap so logs don't interleave at startup
    await new Promise(r => setTimeout(r, 800));

    // 4. Start Frontend
    runNpm('dev', UI_DIR, 'UI');

    console.log('\n========================================');
    console.log('  All services starting up!');
    console.log('  UI         ->  http://localhost:5173');
    console.log('  Backend    ->  http://localhost:3000');
    console.log('  Blockchain ->  http://127.0.0.1:8545');
    console.log('========================================\n');
}

start();
