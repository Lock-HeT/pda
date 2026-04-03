import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const depositAddress = process.env.GAME_ADDRESS || '0x5DEcE7C78b2eC922A67b6E96eBB956950Ab765b0';
    const PDADeposit = await ethers.getContractAt('PDADeposit', depositAddress);

    await PDADeposit.setLiquidityManager('0x63ffE056943EC4e67dF37504E10d2dD816D8dcaE');

    const dappAddress = await PDADeposit.liquidityManager();
    console.log('dappAddress:', dappAddress);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
