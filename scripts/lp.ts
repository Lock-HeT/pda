import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const lpAddress = process.env.GAME_ADDRESS || '0xbBfC15F00e5ef454c1b782C7A4AAA22C991A8A2b';
    const PDALiquidityManager = await ethers.getContractAt('PDALiquidityManager', lpAddress);


    const lpInfo =  await PDALiquidityManager.getUserLPInfo( '0x8DA841a675CC5daa7829aaEFd9dD683204912935', 0);
    console.log('LP Info:', lpInfo);
    const lockedLP = await PDALiquidityManager.totalLPLocked();
    console.log('Total LP Locked:', lockedLP.toString());
    await PDALiquidityManager.removeLiquidity(0);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
//107170508480912363442
//2961572183165823461,