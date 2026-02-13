import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const nftAddress = "0xc9a8490A9dA360CCcBa514235220B34Be901DAD9";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);

    const nftContract = await ethers.getContractAt('PDARecruitmentNFT', nftAddress);

    const tx = await nftContract.getUserTokens("0x8DA841a675CC5daa7829aaEFd9dD683204912935");
   console.log('   User Tokens:', tx);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
