import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {

    const receiverContractAddress = "0x7E4a21d64afD8F11C41D153ce478A404b1169969";


    // 0.001 USDT
    const receiverContract = await ethers.getContractAt('BurnReceiver', receiverContractAddress);
    await receiverContract.setPDA("0x910914F4F5A848bA030FCc6550cc32ba7583EE3C");
    console.log('\n✅ BurnReceiver completed successfully!');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
