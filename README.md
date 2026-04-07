# EduDocs: Blockchain-Based Certificate Verification System

EduDocs is a secure and transparent platform for academic certificate issuance and verification. By leveraging blockchain technology, the system ensures that certificates are immutable, tamper-proof, and easily verifiable by third parties.

The system consists of a local Ethereum blockchain (Hardhat), a Node.js backend server integrated with Supabase for data persistence-less storage and authentication, and a modern React-based verifier interface.

---

## 🏛️ Project Architecture

- **Blockchain (Rednet Node)**: A local Hardhat instance acting as the trust layer where document hashes and certificate records are stored.
- **Backend (API Server)**: A Node.js/Express service that handles user authentication, file hashing, and interacts with the smart contract and Supabase.
- **Verifier UI (Frontend)**: A React/Vite web application that allows administrators to manage users, issuers to certify documents, and users to verify their credentials.
- **Issuer CLI**: A command-line tool for bootstrapping issuer keys and registering universities manually.

---

## Prerequisites

### Node.js Requirement
This project requires **Node.js version 18.20.8**. Higher versions (like Node 22) may cause compatibility issues with Hardhat internals.

### Environment Setup
1. **NVM (Optional but Recommended)**: To manage Node versions.
2. **Supabase**: A Supabase project is required for the backend's user management and profiles. Ensure you have your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` ready.

---

## How to Run the Project

The system requires multiple services to be running concurrently. Follow these steps in separate terminals:

### ⚡ The Automated Way (Recommended)
To start everything (Blockchain Node, Backend, UI, and Contract deployment) with a single command:
```bash
npm run start-all
```
This script will automatically detect if the node is running, deploy the contract, sync the address across all modules, and launch the services.

---

### 1. Start the Blockchain Node (Rednet)
If you prefer manual control, start the local blockchain node first:
```bash
npm run node
```
*Note: This terminal will list several accounts. Account 0 is used as the default funder.*

### 2. Deploy the Smart Contract
In a new terminal, deploy the `Certificates.sol` contract to the local network:
```bash
npm run deploy-local
```
*Copy the **Certificates deployed to** address. You will need this for the backend configuration and verifier UI.*

### 3. Start the Backend API Server
Navigate to the backend directory and start the Express server:
```bash
cd backend
npm install
npm run dev
```
*Make sure your `.env` file in the `backend/` folder is configured with your Supabase credentials and the deployed contract address.*

### 4. Start the Verifier UI (Frontend)
Navigate to the UI directory and start the Vite development server:
```bash
cd verifier-ui
npm install
npm run dev
```
*The UI will be accessible at `http://localhost:5173`.*

---

## 🏗️ Project Structure

```text
EduDocs/
├── contracts/          # Solidity smart contracts
├── backend/            # Express API server & user management
├── verifier-ui/        # React + Vite frontend application
├── issuer-cli/         # Bootstrapping tools for issuers
├── scripts/            # Hardhat deployment and utility scripts
├── keys/               # (Sensitive) Local storage for issuer private keys
├── samples/            # Sample PDF certificates for testing
├── hardhat.config.js   # Hardhat blockchain configuration
└── package.json        # Root dependencies and scripts
```

---

## 👨‍💼 Role-Based Access Control

1. **Master Admin**: Can create and manage User and Issuer accounts.
2. **Issuer (University)**: Can register their identity on-chain and issue certficates for students.
3. **Normal User (Student/Third-party)**: Can view their own documents and verify any certificate by uploading the PDF.

---

## 🛡️ Security Notes
- **Private Keys**: Never share the `.json` files in the `keys/` directory. They contain the cryptographic signatures of the university.
- **Hardhat State**: If you restart the blockchain node (`npm run node`), the entire state (including registered issuers and issued certificates) is wiped. You must redeploy the contract and re-register issuers.
- **Data Integrity**: The SHA-256 hash of every certificate is stored on the blockchain. Any modification to the PDF (even adding a single pixel) will cause a verification failure.

---

## 🔧 Troubleshooting

- **"HH502: Could not download compiler"**: Check that you are using Node 18.20.8.
- **"EADDRINUSE: 127.0.0.1:8545"**: A blockchain node is already running. Kill the process and try again.
- **"Sender does not have enough funds"**: Ensure the issuer wallet has been funded using the Hardhat account 0 (Account with address starting `0xf39f`).
