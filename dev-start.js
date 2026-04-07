const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = 'http://127.0.0.1:8545';
const BACKEND_DIR = path.join(__dirname, 'backend');
const UI_DIR = path.join(__dirname, 'verifier-ui');

async function isNodeRunning() {
    try {
        const res = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 })
        });
        return res.status === 200;
    } catch (e) {
        return false;
    }
}

function runCommand(command, cwd, name) {
    console.log(`[${name}] Starting...`);
    const [cmd, ...args] = command.split(' ');
    // Use shell: true for Windows compatibility with npm/npx
    const proc = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
    
    proc.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
    });
    return proc;
}

async function start() {
    console.log("--- EduDocs Automated Dev Startup ---");

    // 1. Start Hardhat Node if not running
    let nodeProc;
    if (!(await isNodeRunning())) {
        console.log("Hardhat node not detected. Starting it now...");
        nodeProc = runCommand('npm run node', __dirname, 'Blockchain');
        
        // Wait for node to be ready
        console.log("Waiting for node to initialize...");
        while (!(await isNodeRunning())) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log("Blockchain node is ready!");
    } else {
        console.log("Hardhat node is already running.");
    }

    // 2. Deploy Contract
    console.log("Deploying/Refreshing contract...");
    try {
        execSync('npm run deploy-local', { stdio: 'inherit', shell: true });
        console.log("Contract deployed and configs synced!");
    } catch (e) {
        console.error("Deployment failed. Make sure the node is stable.");
    }

    // 3. Start Backend
    runCommand('npm run dev', BACKEND_DIR, 'Backend');

    // 4. Start Verifier UI
    runCommand('npm run dev', UI_DIR, 'UI');

    console.log("\nAll services are starting up!");
    console.log("UI: http://localhost:5173");
    console.log("Backend: http://localhost:3000");
    console.log("Blockchain: http://127.0.0.1:8545");
}

start();
