const { run } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Veuillez définir CONTRACT_ADDRESS dans votre .env");
    process.exit(1);
  }

  console.log("🔍 Vérification du contrat sur Etherscan...");
  console.log("📍 Adresse:", contractAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // Le constructeur VoteInChain n'a pas d'arguments
    });
    
    console.log("✅ Contrat vérifié avec succès!");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("ℹ️ Le contrat est déjà vérifié");
    } else {
      console.error("❌ Erreur lors de la vérification:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });