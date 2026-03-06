import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🔍 Debugging Receiver Contract...\n');

    const receiverContractAddress = "0x953eAe28eb90714C2D9B82Cc5332F4B615799f8F";
    const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
    const vusdtAddress = "0xfD5840Cd36d94D7229439859C0112a4185BC0255";

    const [signer] = await ethers.getSigners();
    console.log('👤 Signer:', signer.address);

    // 获取合约实例
    const receiverContract = await ethers.getContractAt('Receiver', receiverContractAddress);
    const usdtContract = await ethers.getContractAt('IERC20', usdtAddress);
    const vusdtContract = await ethers.getContractAt('IVenusVToken', vusdtAddress);

    // 1. 检查 withdrawer
    const withdrawer = await receiverContract.withdrawer();
    console.log('✓ Withdrawer:', withdrawer);
    console.log('✓ Is withdrawer:', signer.address === withdrawer);

    // 2. 检查 recipient
    const recipient = await receiverContract.recipient();
    console.log('✓ Recipient:', recipient);

    // 3. 检查 USDT 余额
    const usdtBalance = await usdtContract.balanceOf(receiverContractAddress);
    console.log('✓ Receiver USDT Balance:', ethers.formatUnits(usdtBalance, 18), 'USDT');

    // 4. 检查 vUSDT 余额
    const vusdtBalance = await vusdtContract.balanceOf(receiverContractAddress);
    console.log('✓ Receiver vUSDT Balance:', ethers.formatUnits(vusdtBalance, 8), 'vUSDT');

    // 5. 检查 USDT 授权
    const allowance = await usdtContract.allowance(receiverContractAddress, vusdtAddress);
    console.log('✓ USDT Allowance to Venus:', ethers.formatUnits(allowance, 18));

    // 6. 尝试小额测试
    const amount = ethers.parseUnits('0.1', 18); // 改成 0.1 USDT
    console.log('\n🧪 Testing with amount:', ethers.formatUnits(amount, 18), 'USDT');

    if (usdtBalance < amount) {
        console.log('❌ Insufficient USDT balance in contract!');
        return;
    }

    try {
        // 模拟调用（不实际执行）
        await receiverContract.withdraw.staticCall(amount);
        console.log('✅ Static call succeeded! Now sending real transaction...');

        // 实际执行
        const tx = await receiverContract.withdraw(amount);
        console.log('📤 Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed in block:', receipt?.blockNumber);
    } catch (error: any) {
        console.log('\n❌ Transaction failed!');
        console.log('Error message:', error.message);
        
        if (error.data) {
            console.log('Error data:', error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
