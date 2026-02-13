import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const tokenAddress =  "0x55d398326f99059fF775485246999027B3197955";
    const contractAddress = "0xc9a8490A9dA360CCcBa514235220B34Be901DAD9";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);
    console.log(`   tokenAddress: ${tokenAddress}`);

    const token = await ethers.getContractAt('PDA', tokenAddress);


    const tx = await token.approve(contractAddress, BigInt(10000000000000000000));
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
