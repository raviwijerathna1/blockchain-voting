const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Voting Contract...\n");

  // Deployer account ගන්න
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(
    "💰 Account balance:", 
    ethers.formatEther(balance), "ETH\n"
  );

  // Contract deploy කරන්න
  const VotingFactory = await ethers.getContractFactory("Voting");
  const voting = await VotingFactory.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting Contract deployed to:", contractAddress);

  // Election setup කරන්න
  console.log("\n⚙️  Setting up election...");

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 60;        // 1 minute later
  const endTime = now + (60 * 60);   // 1 hour later

  const initTx = await voting.initializeElection(
    "Presidential Election 2024",
    "Vote for your preferred presidential candidate",
    startTime,
    endTime
  );
  await initTx.wait();
  console.log("✅ Election initialized");

  // Candidates add කරන්න
  console.log("\n👥 Adding candidates...");

  const candidates = [
    {
      name: "Kamal Perera",
      party: "Democratic Party",
      imageUrl: "https://example.com/kamal.jpg",
    },
    {
      name: "Nimal Silva",
      party: "United National Party",
      imageUrl: "https://example.com/nimal.jpg",
    },
    {
      name: "Sunil Fernando",
      party: "People's Party",
      imageUrl: "https://example.com/sunil.jpg",
    },
  ];

  for (const candidate of candidates) {
    const tx = await voting.addCandidate(
      candidate.name,
      candidate.party,
      candidate.imageUrl
    );
    await tx.wait();
    console.log(`✅ Added candidate: ${candidate.name}`);
  }

  // Test voters register කරන්න
  console.log("\n📋 Registering test voters...");
  
  const signers = await ethers.getSigners();
  const testVoters = signers.slice(1, 6).map(s => s.address);
  
  const registerTx = await voting.registerVotersBatch(testVoters);
  await registerTx.wait();
  console.log(`✅ Registered ${testVoters.length} test voters`);

  // Contract info save කරන්න
  console.log("\n📄 Contract Information:");
  console.log("========================");
  console.log("Address:", contractAddress);
  console.log("Network:", network.name);
  console.log("Start Time:", new Date(startTime * 1000).toLocaleString());
  console.log("End Time:", new Date(endTime * 1000).toLocaleString());

  // Frontend සඳහා config save කරන්න
  const fs = require("fs");
  const config = {
    contractAddress,
    network: network.name,
    deployedAt: new Date().toISOString(),
    startTime,
    endTime,
  };
  
  fs.writeFileSync(
    "./frontend/src/config/contract.json",
    JSON.stringify(config, null, 2)
  );
  console.log("\n✅ Config saved to frontend/src/config/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });