# Student Certificates Prototype

This project is a local prototype for issuing and verifying student certificates using a simple Ethereum smart contract (Hardhat local network), local issuer keys, and a browser-based verifier UI (Vite + React).

## Quickstart (high-level)
1. Install Node.js (v18 or v20).
2. From project root run: `npm run node` (starts Hardhat local node).
3. In another terminal run: `npm run deploy-local` to deploy the contract.
4. Generate issuer key: `cd issuer-cli && node keygen.js ../keys/uni1`
5. Register issuer: `node registerIssuer.js ../keys/uni1/issuer.json <contract-address>`
6. Issue a certificate: `node issue.js ../keys/uni1/issuer.json <contract-address> "UNI2025-0001" ../samples/asha_degree.pdf`
7. Start verifier UI: `cd verifier-ui && npm install && npm run dev` and open the URL (usually http://localhost:5173).

See detailed instructions in the conversation where these files were generated.

-------------------------

# EduDocs: Blockchain Based Certificate Verification Prototype

## Project Overview

EduDocs is a demonstration project that shows how academic certificates can be issued and verified using blockchain technology. It allows a university (issuer) to register itself, issue a certificate for a student, and allows a verifier to upload a PDF and check whether the certificate is genuine.

This prototype uses a local blockchain with Hardhat, smart contracts written in Solidity, a small issuer command line tool built in Node.js, and a verification interface built with React and Vite. The goal is to prevent document forgery and make verification easy and transparent.

---

## How the System Works

The core idea is simple. A university uploads a PDF and the system computes its SHA-256 hash. This hash is written to the blockchain and linked to a unique credential identifier. When a verifier uploads the same PDF later, the system computes its hash again and checks whether it matches the on-chain hash.

### Basic flow

```
Issuer uploads PDF
PDF -> SHA-256 hash -> stored on blockchain
Credential text -> keccak256 -> credentialId -> stored on blockchain

Verifier uploads PDF
PDF -> SHA-256 hash -> compared with stored hash
If both match -> certificate is valid
```

---

## Project Structure

This is the exact directory layout of your project:

```
EduDocs_Prototype/
│── artifacts/
│── cache/
│── contracts/
│     └── Certificates.sol
│── issuer-cli/
│     ├── keygen.js
│     ├── registerIssuer.js
│     ├── issue.js
│     └── fundIssuer.js
│── verifier-ui/
│     ├── index.html
│     ├── package.json
│     └── src/
│          ├── main.jsx
│          └── App.jsx
│── keys/
│── samples/
│     └── asha_degree.pdf
│── scripts/
│     └── deploy.js
│── hardhat.config.js
│── package.json
│── README.md
```

---

## Prerequisites

### Node.js Version Requirement

The project has been tested and verified to work correctly with:

**Node.js version: 18.20.8**

Other versions caused compilation problems, compiler download failures, or Hardhat runtime issues. Use this exact version for predictable behavior.

---

## Setting Up the Environment

### Step 1: Install NVM

NVM allows you to install and switch between Node.js versions easily.

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Verify installation:

```
nvm --version
```

### Step 2: Install the correct Node.js version

```
nvm install 18.20.8
nvm use 18.20.8
node -v       # should output v18.20.8
```

### Step 3: Install dependencies

```
cd EduDocs_Prototype
rm -rf node_modules package-lock.json
npm install
```

---

## Running the Project

The system requires multiple terminals. Each terminal performs one part of the workflow.

### Terminal A: Start Hardhat Node

```
cd EduDocs_Prototype
npm run node
```

You will see a list of accounts that Hardhat generates. Account 0 has a private key that will be used to fund your issuer wallet.

Do not close this terminal.

---

### Terminal B: Deploy the Smart Contract

```
cd EduDocs_Prototype
npm run deploy-local
```

You will see:

```
Certificates deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy this contract address. It is required in later steps.

---

## Issuer Operations

Open a new terminal for each step below.

### Terminal C: Install Issuer CLI packages

```
cd EduDocs_Prototype/issuer-cli
npm install
```

### Step 1: Generate Issuer Keys

```
node keygen.js ../keys/uni1
```

This creates:

```
keys/uni1/issuer.json
```

Do not commit this file anywhere. It contains the private key of the issuer.

### Step 2: Fund the Issuer Wallet

The issuer begins with zero ETH. Hardhat account 0 (shown when starting the node) has enough funds to send ETH to the issuer.

```
node fundIssuer.js ../keys/uni1/issuer.json 1
```

This sends 1 ETH to the issuer wallet.

### Step 3: Register Issuer

Use the contract address from the deployment step.

```
node registerIssuer.js ../keys/uni1/issuer.json 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 4: Issue a Certificate

```
node issue.js ../keys/uni1/issuer.json 0x5FbDB2315678afecb367f032d93F642f64180aa3 "UNI2025-0001" ../samples/asha_degree.pdf
```

This writes:

- credentialId  
- docHash  
- issuer address  
- timestamp  

to the blockchain.

---

## Verifying a Certificate

### Terminal D: Start the Verifier UI

```
cd EduDocs_Prototype/verifier-ui
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

### Verification steps

1. Paste contract address  
2. Enter the credential text used during issuance  
3. Upload the same PDF  
4. Click Verify Certificate  

If everything matches, the verifier UI will display a valid certificate message.

---

## Reference Table: Keys, Hashes, and Addresses

The following table explains all the important values used in this system.

| Name | Example | Source | Purpose | Used In |
|------|---------|--------|---------|---------|
| Contract Address | 0x5FbDB2... | Deployment step | Identifies Certificates smart contract | Issuer CLI, Verifier UI |
| Hardhat Account | 0xf39F... | Hardhat node | Pre funded local dev wallet | Funding issuer |
| Funder Private Key | 0xac0974... | Hardhat Account 0 | Sends ETH to issuer wallet | fundIssuer.js |
| Issuer Private Key | keys/uni1/issuer.json | keygen.js | Signs all issuer transactions | registerIssuer.js, issue.js |
| Issuer Address | 0x255E... | Derived from private key | University identity on chain | Smart contract storage |
| Credential Text | "UNI2025-0001" | Manually chosen | Input for credential identifier | Issuer CLI and UI |
| Credential ID | keccak256(text) | Auto generated | Lookup key for stored certificate | Smart contract |
| Document Hash | 0x93fe... | SHA 256 of PDF | Ensures PDF is not modified | Issuer CLI and UI |
| RPC Endpoint | http://127.0.0.1:8545 | Hardhat node | Local blockchain endpoint | All modules |
| SHA 256 (browser) | computed client side | Web Crypto | PDF integrity check | Verifier UI |

---

## Troubleshooting Guide

Below are the common errors faced while running this project and their respective solutions.

### HH502: Could not download compiler version list

Cause: Unsupported Node version or incompatible compilation environment.

Fix:

```
nvm use 18.20.8
rm -rf node_modules
npm install
```

### HHE22: Trying to use a non local installation of Hardhat

Fix:

```
npm install --save-dev hardhat
```

### EADDRINUSE: 127.0.0.1:8545

Cause: A Hardhat node is already running.

Fix:

```
lsof -i :8545
kill -9 <PID>
```

### Sender does not have enough funds

Cause: Issuer wallet has zero ETH.

Fix:

```
node fundIssuer.js ../keys/uni1/issuer.json 1
```

### UI cannot connect to blockchain

Ensure Hardhat node is running:

```
npm run node
```

### Verification failure due to hash mismatch

Possible reasons:

- Wrong PDF uploaded  
- Incorrect credential text  
- Incorrect contract address  

Check all three inputs carefully.

### TypeError: “data” argument must be string or Buffer

Cause: Node 22 is not compatible with Hardhat internals.

Fix: Switch to Node 18.20.8.

### Missing node_modules after switching Node versions

Fix:

```
rm -rf node_modules
npm install
```

---

## Resetting Hardhat State

If you want a clean start:

```
killall node
rm -rf artifacts cache
npm run node
npm run deploy-local
```

---

## Security Notes

- Do not commit any private keys contained in the keys directory.  
- This prototype is not suitable for deployment on real networks.  
- Hardhat resets all accounts when restarted.  
- Never expose your local RPC port publicly.

---

## Possible Future Enhancements

- Add IPFS storage for PDF files  
- Add Verifiable Credential export  
- Add role based user interfaces  
- Add QR code support for easy verification  
- Integrate DID based issuer identities  
- Add a backend service for indexing and analytics  

---

## Conclusion

This prototype demonstrates a complete workflow for issuing and verifying certificates on a blockchain. It can be used for academic demonstrations, training, or as a base for a more polished production system.

If you want to extend this system or prepare presentation material for faculty, support is available.

