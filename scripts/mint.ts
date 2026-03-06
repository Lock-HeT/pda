import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const nftAddress = "0x8Df408b9241771eCe9fE850214ED8101c58eB089";


    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);

    const nftContract = await ethers.getContractAt('PDARecruitmentNFT', nftAddress);

    await nftContract.setTreasuryB('0xf7130286D40efbfBB4dBe61355Fd29570d03827A');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
