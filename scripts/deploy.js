async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Certificates = await ethers.getContractFactory("Certificates");
  const cert = await Certificates.deploy();
  await cert.deployed();

  console.log("Certificates deployed to:", cert.address);

  const fs = require('fs');
  const path = require('path');
  
  const config = {
    contractAddress: cert.address,
    network: "localhost",
    lastDeployed: new Date().toISOString()
  };

  // 1. Root config
  fs.writeFileSync(path.join(__dirname, '../config.json'), JSON.stringify(config, null, 2));

  // 2. UI config
  const uiConfigPath = path.join(__dirname, '../verifier-ui/src/config.json');
  fs.writeFileSync(uiConfigPath, JSON.stringify(config, null, 2));

  // 3. Backend config
  const backendConfigPath = path.join(__dirname, '../backend/config.json');
  fs.writeFileSync(backendConfigPath, JSON.stringify(config, null, 2));

  console.log("Centralized config updated in root, UI, and Backend.");
  console.log("New Address:", cert.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
