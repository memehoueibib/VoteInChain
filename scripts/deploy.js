const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Déploiement du contrat VoteInChain...");

  // Obtenir le déployeur
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);

  // Vérifier le solde
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", ethers.formatEther(balance), "ETH");

  // Déployer le contrat
  const VoteInChain = await ethers.getContractFactory("VoteInChain");
  
  console.log("⏳ Déploiement en cours...");
  const voteInChain = await VoteInChain.deploy();
  
  await voteInChain.waitForDeployment();
  const contractAddress = await voteInChain.getAddress();
  
  console.log("✅ Contrat déployé à l'adresse:", contractAddress);

  // Ajouter les candidats
  console.log("👥 Ajout des candidats...");
  
  const candidates = [
    "Carolina HENAO URIBE",
    "Meme HOUEIBIB", 
    "Marwane ZAIM SASSI",
    "Mouad KARROUM",
    "Roa CHAIR",
    "Saad EL MATBAI",
    "Ismail BRAHIMI",
    "Fatima-Zohra BAKALI",
    "Enzo SEGHI",
    "Vladimir KREMNEV"
  ];

  for (let i = 0; i < candidates.length; i++) {
    const tx = await voteInChain.addCandidate(candidates[i]);
    await tx.wait();
    console.log(`✓ Candidat ajouté: ${candidates[i]}`);
  }

  // Vérifier le déploiement
  const candidateCount = await voteInChain.candidateCount();
  const votingActive = await voteInChain.votingActive();
  const admin = await voteInChain.admin();

  console.log("\n📊 Informations du contrat:");
  console.log("- Adresse:", contractAddress);
  console.log("- Nombre de candidats:", candidateCount.toString());
  console.log("- Vote actif:", votingActive);
  console.log("- Administrateur:", admin);

  // Sauvegarder les informations de déploiement
  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    deployer: deployer.address,
    blockNumber: await deployer.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    candidates: candidates.length,
    gasUsed: "Estimation en cours..."
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n🎉 Déploiement terminé avec succès!");
  console.log("📄 Informations sauvegardées dans deployment-info.json");
  
  // Instructions pour la vérification
  console.log("\n🔍 Pour vérifier le contrat sur Etherscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement:", error);
    process.exit(1);
  });