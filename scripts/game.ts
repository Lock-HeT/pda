import { ethers } from 'hardhat';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const gameAddress = process.env.GAME_ADDRESS || '0xB94a38B0512F076B762F260DCe2e262330db2662';
    const PDAGameV2 = await ethers.getContractAt('PDAGame', gameAddress);

    //await PDAGameV2.joinGame( BigInt(10 ** 15), '0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c'); // 0.001 USDT
    await PDAGameV2.setDappAddress('0xb680ad3b50143500a785388fa0a9dd084697ea5e');
    console.log('\n========================================');
    console.log('PDAGame Contract Info');
    console.log('========================================');
    console.log('Contract Address:', gameAddress);
    console.log('');

    // 测试游戏 ID 1
    const gameId = BigInt(1);
    console.log(`\nGame ID ${gameId} Information:`);
    console.log('----------------------------');
    
    const gameInfo = await PDAGameV2.getGame(gameId);
    console.log('Game ID:', gameInfo[0].toString());
    console.log('Bet Amount:', ethers.formatUnits(gameInfo[1], 18), 'USDT');
    console.log('Players Count:', gameInfo[2].length);
    console.log('Players:', gameInfo[2]);
    console.log('Start Time:', new Date(Number(gameInfo[3]) * 1000).toLocaleString());
    console.log('End Time:', gameInfo[4] > 0 ? new Date(Number(gameInfo[4]) * 1000).toLocaleString() : 'Not ended');
    console.log('Finished:', gameInfo[5]);
    console.log('Refunded:', gameInfo[6]);
    console.log('Winner:', gameInfo[7]);

    console.log('\n----------------------------');

    const gamePlayerInfo = await PDAGameV2.getGamePlayers(gameId);
    console.log('Players (via getGamePlayers):', gamePlayerInfo);

    console.log('\n----------------------------');
    const betAmount = BigInt(10 ** 15);
    const current = await PDAGameV2.getCurrentGame(betAmount);
    console.log('Current Game for', ethers.formatUnits(betAmount, 18), 'USDT:');
    console.log('  Game ID:', current[0].toString());
    console.log('  Player Count:', current[1].toString());
    console.log('  Start Time:', new Date(Number(current[2]) * 1000).toLocaleString());
    console.log('  Can Join:', current[3]);

    console.log('\n========================================\n');

    /*await PDAGameV2.setGameOperator("0xb680ad3b50143500a785388fa0a9dd084697ea5e");
    console.log('✅ Game operator updated successfully!');*/
 /*   const tx = await PDAGameV2.declareWinner(gameId, '0x8DA841a675CC5daa7829aaEFd9dD683204912935');
    const receipt = await (tx as any).wait();
    console.log('✅ Winner declared successfully! Transaction Hash:', await receipt.transactionHash);*/
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
