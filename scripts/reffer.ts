import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const refferAddress = process.env.GAME_ADDRESS || '0x3d75408c0d0fF867d5D3Ac246E4024Cfd074710E';
    const PDAReferral = await ethers.getContractAt('PDAReferral', refferAddress);

    const address = await PDAReferral.activeReferralCount('0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c');
    console.log(' Address:', address);
    console.log('');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
