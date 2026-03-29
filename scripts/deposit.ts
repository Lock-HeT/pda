import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const depositAddress = process.env.GAME_ADDRESS || '0x5DEcE7C78b2eC922A67b6E96eBB956950Ab765b0';
    const PDADeposit = await ethers.getContractAt('PDADeposit', depositAddress);
    let opeationAddress = await PDADeposit.operationAddress();
    console.log('Operation Address:', opeationAddress);
    await PDADeposit.setOperationAddress('0xd938851FdDAa81Cc021Aa1CCE2539901DFF11bF8');
    opeationAddress = await PDADeposit.operationAddress();
    console.log('Updated Operation Address:', opeationAddress);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
