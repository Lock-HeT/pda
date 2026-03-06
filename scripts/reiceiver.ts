import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Starting Receiver Withdraw (USDT only)...\n');

    const receiverContractAddress = "0xDbAdd26b7693399a16B4B1D5431C2F3110578dec";
    const usdtAddress = "0x55d398326f99059ff775485246999027b3197955";


    // 0.001 USDT
    const amount = ethers.parseUnits('0.001', 18);
    const receiverContract = await ethers.getContractAt('Receiver', receiverContractAddress);
    const usdtContract = await ethers.getContractAt('PDA', usdtAddress);
    await usdtContract.transfer(receiverContractAddress, amount);
    await receiverContract.withdraw(amount)
    console.log('\n✅ Receiver Withdraw completed successfully!');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
