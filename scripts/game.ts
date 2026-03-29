import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const gameAddress = process.env.GAME_ADDRESS || '0x6E6b90DD50b8EC288F5b7c652951B81b68611C1e';
    const PDAGameV2 = await ethers.getContractAt('PDAGame', gameAddress);
    const gameInfo = await PDAGameV2.getGame(BigInt(213));
    console.log('Game id:', gameInfo[0]);
    console.log('Player 1:', gameInfo[2]);
    console.log('is finished:', gameInfo[5]);
    console.log('is refund:', gameInfo[6]);
    /*await PDAGameV2.refundForUsers(BigInt(100) * BigInt(1e18), ['0x0b28d86f8a2c1857f877a409d91f8527400a4734']);
*/
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
