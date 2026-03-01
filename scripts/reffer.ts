import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const refferAddress = process.env.GAME_ADDRESS || '0x22397bf4f60A7A071DCa1267178167437b13769e';
    const PDAReferral = await ethers.getContractAt('PDAReferral', refferAddress);

    const address = await PDAReferral.isActiveUser('0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c');
    console.log(' isActive:', address);
    console.log('');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
