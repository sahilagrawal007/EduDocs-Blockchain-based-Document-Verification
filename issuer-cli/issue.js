// issue.js
// Usage: node issue.js <issuer-json-path> <contract-address> <credentialIdText> <path-to-pdf>
// Example: node issue.js ../keys/uni1/issuer.json 0xContractAddress "UNI2025-0001" ../samples/asha_degree.pdf

const fs = require('fs');
const { ethers } = require('ethers');
const crypto = require('crypto');
const path = require('path');

async function main() {
  const issuerJson = process.argv[2];
  const contractAddress = process.argv[3];
  const credentialText = process.argv[4]; // any text used to derive credentialId
  const pdfPath = process.argv[5];

  if (!issuerJson || !contractAddress || !credentialText || !pdfPath) {
    console.error("Usage: node issue.js <issuer-json-path> <contract-address> <credentialIdText> <path-to-pdf>");
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error("PDF path does not exist:", pdfPath);
    process.exit(1);
  }

  // compute SHA-256 hash of file (hex)
  const fileBuffer = fs.readFileSync(pdfPath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const bytes32Hash = "0x" + hash; // we'll pass bytes32-ish value (32 bytes hex)

  // derive credentialId as keccak256 of credentialText (to get bytes32)
  const credentialId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialText));

  const issuer = JSON.parse(fs.readFileSync(issuerJson));
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(issuer.privateKey, provider);

  // ABI for issueCertificate(bytes32, bytes32)
  const abi = [
    "function issueCertificate(bytes32 credentialId, bytes32 docHash) external"
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log("Issuing credentialId:", credentialId);
  console.log("docHash (sha256):", bytes32Hash);

  const tx = await contract.issueCertificate(credentialId, bytes32Hash);
  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Issued certificate on-chain.");
  console.log("Recorded => credentialId:", credentialId, ", docHash:", bytes32Hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
