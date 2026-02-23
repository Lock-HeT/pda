import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const tokenAddress =  "0x38F176661751540219a145a719Fd3fEf730Ef3ba";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);
    console.log(`   tokenAddress: ${tokenAddress}`);

    const Token = await ethers.getContractAt('PDA', tokenAddress);


    const tx = await Token.transfer("0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c", BigInt(200000000 * 10 ** 18));
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
