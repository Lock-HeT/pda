import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const tokenAddress =  "0xe119d60c87194CbC114DF8014a0C9d4947dc7008";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);
    console.log(`   tokenAddress: ${tokenAddress}`);

    const token = await ethers.getContractAt('PDA', tokenAddress);


    const tx = await token.addWhiteList("0x6559A58EeeC2E75Ad78B2779c008665De35f0Ef8");
    const receipt = await (tx as any).wait();
    console.log(`   Transaction hash: ${receipt?.hash || receipt?.transactionHash}`);
    console.log(`   Block number: ${receipt?.blockNumber}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
