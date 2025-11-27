// fundIssuer.js
// Usage: node fundIssuer.js <issuer-json-path> <amountInEther>
// Example: node fundIssuer.js ../keys/uni1/issuer.json 1

const fs = require("fs");
const { ethers } = require("ethers");

async function main() {
  const issuerJson = process.argv[2];
  const amt = process.argv[3] || "1.0";

  if (!issuerJson) {
    console.error("Usage: node fundIssuer.js <issuer-json-path> <amountInEther>");
    process.exit(1);
  }

  // load issuer address
  const issuer = JSON.parse(fs.readFileSync(issuerJson));
  const toAddr = issuer.address;
  console.log("Funding issuer address:", toAddr, "amount:", amt, "ETH");

  // Use Hardhat default funded account private key (account #0)
  // This key is printed in the terminal where you ran `npx hardhat node`.
  // If you restarted Hardhat, make sure to use the private key printed in that run.
  const FUNDER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const funder = new ethers.Wallet(FUNDER_PRIVATE_KEY, provider);

  const tx = await funder.sendTransaction({
    to: toAddr,
    value: ethers.utils.parseEther(amt),
  });

  console.log("Sent tx hash:", tx.hash);
  await tx.wait();
  console.log("Funding confirmed.");
  const bal = await provider.getBalance(toAddr);
  console.log("Issuer balance now:", ethers.utils.formatEther(bal), "ETH");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});