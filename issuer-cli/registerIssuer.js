// registerIssuer.js
// Usage: node registerIssuer.js <issuer-json-path> <contract-address>
// Example: node registerIssuer.js ../keys/uni1/issuer.json 0xContractAddress

const fs = require('fs');
const { ethers } = require('ethers');
const path = require('path');

async function main() {
  const issuerJson = process.argv[2];
  const contractAddress = process.argv[3];

  if (!issuerJson || !contractAddress) {
    console.error("Usage: node registerIssuer.js <issuer-json-path> <contract-address>");
    process.exit(1);
  }

  const issuer = JSON.parse(fs.readFileSync(issuerJson));
  const privateKey = issuer.privateKey;

  // connect to local Hardhat node
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

  const wallet = new ethers.Wallet(privateKey, provider);

  // ABI minimal for registerIssuer
  const abi = [
    "function registerIssuer() external"
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  const tx = await contract.registerIssuer();
  console.log("Sent registerIssuer tx. Hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Issuer registered on contract:", wallet.address);
}

main().catch((e) => { console.error(e); process.exit(1); });
