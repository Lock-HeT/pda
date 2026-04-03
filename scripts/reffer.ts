import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const refferAddress = process.env.GAME_ADDRESS || '0x52Ed5db123B93E5595d1b591a4Da70b187d02887';
    const PDAReferral = await ethers.getContractAt('PDAReferral', refferAddress);

    const address = await PDAReferral.setActiveUserManager('0xa5Ed7a4deF1B6a6EE44250f19411F4ab084b7274');
    console.log(' isActive:', address);
    console.log('');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
