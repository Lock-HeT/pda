import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting Excluded From Fee...\n');

    const nftAddress = "0x569ABEFDA947372579cc7533e6D0eaC83fDe01f5";

    const [signer] = await ethers.getSigners();
    console.log(`   Signer: ${signer.address}`);

    const nftContract = await ethers.getContractAt('PDARecruitmentNFT', nftAddress);
    const tx = await nftContract.removeLiquidity(BigInt(4 * 10 ** 18));
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
