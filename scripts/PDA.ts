import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const tokenAddress =  "0x4309CB417bF528018DB73d89bCd9C66A4eE466AA";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);
    console.log(`   tokenAddress: ${tokenAddress}`);

    const token = await ethers.getContractAt('PDA', tokenAddress);
    const tx = await token.setBurnAddress("0x62a481dC98D94145E7BEd77c9A474A5dA18898A8");
    const receipt = await (tx as any).wait();
    console.log(`   Transaction hash: ${receipt?.hash || receipt?.transactionHash}`);
    console.log(`   Block number: ${receipt?.blockNumber}`);

 /*   const tx1 = await token.setBurnSetter("0xa5Ed7a4deF1B6a6EE44250f19411F4ab084b7274");
    const receipt1 = await (tx1 as any).wait();
    console.log(`   Transaction hash: ${receipt1?.hash || receipt1?.transactionHash}`);
    console.log(`   Block number: ${receipt1?.blockNumber}`);*/
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
