import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const depositAddress = process.env.GAME_ADDRESS || '0x0C737142078366C627F37B978933b26ed4fC784F';
    const PDADeposit = await ethers.getContractAt('PDADeposit', depositAddress);


    await PDADeposit.deposit(BigInt(10 ** 15), '0xae58175975532C11E24282aBB1F7Bb52B7819548');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
