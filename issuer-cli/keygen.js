// keygen.js
// Usage: node keygen.js <output-folder>
// Example: node keygen.js ../keys/uni1

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const out = process.argv[2] || "./keys";
  if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

  const wallet = ethers.Wallet.createRandom();
  const priv = wallet.privateKey;
  const addr = wallet.address;

  const data = {
    address: addr,
    privateKey: priv
  };

  fs.writeFileSync(path.join(out, "issuer.json"), JSON.stringify(data, null, 2));
  console.log("Issuer wallet created:");
  console.log("Address:", addr);
  console.log("Private key saved to:", path.join(out, "issuer.json"));
  console.log("Keep the private key secure. Do NOT commit it to git.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); });
