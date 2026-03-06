import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🔍 Testing IBUSDT deposit mechanism...\n');

    const USDT = '0x55d398326f99059fF775485246999027B3197955';
    const IBUSDT_ADDRESS = '0x158Da805682BdC8ee32d52833aD41E74bb951E59';
    const amount = ethers.parseUnits('0.001', 18);

    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}\n`);

    const usdtContract = await ethers.getContractAt('IERC20', USDT);
    const ibusdtContract = await ethers.getContractAt('IBUSDT', IBUSDT_ADDRESS);

    // Check USDT balance
    const usdtBalance = await usdtContract.balanceOf(signer.address);
    console.log(`USDT Balance: ${ethers.formatUnits(usdtBalance, 18)} USDT`);

    // Check current IBUSDT balance
    const ibusdtBalanceBefore = await ibusdtContract.balanceOf(signer.address);
    console.log(`IBUSDT Balance Before: ${ethers.formatUnits(ibusdtBalanceBefore, 18)}\n`);

    // Test 1: Direct deposit (should work)
    console.log(`📝 Test 1: Direct deposit from EOA`);
    try {
        // Approve USDT to IBUSDT
        console.log(`   Approving USDT...`);
        const approveTx = await usdtContract.approve(IBUSDT_ADDRESS, amount);
        await approveTx.wait();
        console.log(`   ✅ Approved`);

        // Deposit
        console.log(`   Depositing...`);
        const depositTx = await ibusdtContract.deposit(amount);
        const receipt = await depositTx.wait();
        console.log(`   ✅ Deposit successful! Gas used: ${receipt?.gasUsed.toString()}`);

        const ibusdtBalanceAfter = await ibusdtContract.balanceOf(signer.address);
        console.log(`   IBUSDT Balance After: ${ethers.formatUnits(ibusdtBalanceAfter, 18)}\n`);
    } catch (e: any) {
        console.log(`   ❌ Failed: ${e.message}\n`);
    }

    // Test 2: Check what happens when contract has USDT
    console.log(`📝 Test 2: Simulating contract scenario`);
    const receiverAddress = "0xAdB710638d938602160f6720dBB2Bf2bF52a13a8";
    
    // Check if receiver has USDT
    const receiverUsdtBalance = await usdtContract.balanceOf(receiverAddress);
    console.log(`   Receiver USDT Balance: ${ethers.formatUnits(receiverUsdtBalance, 18)}`);
    
    // Check allowance from receiver to IBUSDT
    const allowance = await usdtContract.allowance(receiverAddress, IBUSDT_ADDRESS);
    console.log(`   Receiver->IBUSDT Allowance: ${ethers.formatUnits(allowance, 18)}\n`);
    
    console.log(`💡 Analysis:`);
    console.log(`   When ibusdt.deposit(amount) is called from Receiver contract:`);
    console.log(`   1. IBUSDT will try to do: USDT.transferFrom(msg.sender, IBUSDT, amount)`);
    console.log(`   2. msg.sender = Receiver contract address`);
    console.log(`   3. So it needs: Receiver to approve IBUSDT to spend Receiver's USDT ✅`);
    console.log(`   4. This should work! Let me check if there are other issues...\n`);

    // Test 3: Try to see IBUSDT contract code or events
    console.log(`📝 Test 3: Check IBUSDT deposit return value`);
    try {
        const receiverContract = await ethers.getContractAt('Receiver', receiverAddress);
        const withdrawer = await receiverContract.withdrawer();
        console.log(`   Receiver withdrawer: ${withdrawer}`);
        console.log(`   Is signer withdrawer: ${withdrawer.toLowerCase() === signer.address.toLowerCase()}\n`);
    } catch (e: any) {
        console.log(`   Error: ${e.message}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
