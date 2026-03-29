import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const lpAddress = '0xAEc7EA41A1cB5F73983cF4574A3de91101a6A6Db';
    const PDALiquidityManager = await ethers.getContractAt('PDALiquidityManager', lpAddress);


    const lpInfo =  await PDALiquidityManager.getUserLPInfo( '0x02589DBF5761A72E1e49fa0062Dec22c38153Cce', 1);
    console.log('0x02589DBF5761A72E1e49fa0062Dec22c38153Cce daysHeld :', lpInfo[4]);

    const startTime = await PDALiquidityManager.sourceStartTime(1);
    console.log('Source Start Time:', startTime);

    const totalLPLocked = await PDALiquidityManager.totalLPLocked();
    console.log('Total LP Locked:', totalLPLocked);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
//1339719134580464011030306
//2961572183165823461,