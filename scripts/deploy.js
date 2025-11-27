async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Certificates = await ethers.getContractFactory("Certificates");
  const cert = await Certificates.deploy();
  await cert.deployed();

  console.log("Certificates deployed to:", cert.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
