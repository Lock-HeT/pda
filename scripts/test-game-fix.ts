import { ethers } from 'hardhat';

async function main() {
    console.log('\n========================================');
    console.log('Testing PDAGame Contract Fix');
    console.log('========================================\n');

    const gameAddress = process.env.GAME_ADDRESS || '0x584BA07262dFb25589aAa9ec8793f61727b2C92F';
    const game = await ethers.getContractAt('PDAGame', gameAddress);

    console.log('Contract Address:', gameAddress);
    console.log('');

    // 测试多个游戏 ID
    const gameIdsToTest = [1, 2, 3];

    for (const gameId of gameIdsToTest) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Testing Game ID: ${gameId}`);
        console.log('='.repeat(50));

        try {
            const gameInfo = await game.getGame(BigInt(gameId));
            
            console.log('\n📊 Game Info (via getGame):');
            console.log('  Game ID:', gameInfo[0].toString());
            console.log('  Bet Amount:', ethers.formatUnits(gameInfo[1], 18), 'USDT');
            console.log('  Players Array Length:', gameInfo[2].length);
            console.log('  Start Time:', gameInfo[3] > 0 ? new Date(Number(gameInfo[3]) * 1000).toLocaleString() : 'Not started');
            console.log('  End Time:', gameInfo[4] > 0 ? new Date(Number(gameInfo[4]) * 1000).toLocaleString() : 'Not ended');
            console.log('  Finished:', gameInfo[5]);
            console.log('  Refunded:', gameInfo[6]);
            console.log('  Winner:', gameInfo[7]);

            if (gameInfo[2].length > 0) {
                console.log('\n👥 Players:');
                gameInfo[2].forEach((player: string, index: number) => {
                    console.log(`  ${index + 1}. ${player}`);
                });
            } else {
                console.log('\n⚠️  No players in array (THIS IS THE BUG!)');
            }

            // 使用 getGamePlayers 再次验证
            const players = await game.getGamePlayers(BigInt(gameId));
            console.log('\n📊 Players (via getGamePlayers):', players.length);
            if (players.length > 0) {
                players.forEach((player: string, index: number) => {
                    console.log(`  ${index + 1}. ${player}`);
                });
            }

            // 比较两个方法的结果
            if (gameInfo[2].length !== players.length) {
                console.log('\n❌ MISMATCH: getGame and getGamePlayers return different player counts!');
                console.log(`   getGame: ${gameInfo[2].length} players`);
                console.log(`   getGamePlayers: ${players.length} players`);
            } else if (gameInfo[2].length > 0) {
                console.log('\n✅ Both methods return the same player count');
            }

        } catch (error: any) {
            if (error.message.includes('Game not found') || gameInfo[0] === 0n) {
                console.log(`\n⚠️  Game ${gameId} not found or not initialized`);
            } else {
                console.log(`\n❌ Error reading game ${gameId}:`, error.message);
            }
        }
    }

    // 测试当前游戏
    console.log('\n' + '='.repeat(50));
    console.log('Testing Current Games');
    console.log('='.repeat(50));

    const betAmounts = [
        { amount: BigInt(10 ** 15), name: '0.001 USDT' },
        { amount: BigInt(2 * 10 ** 15), name: '0.002 USDT' },
        { amount: BigInt(3 * 10 ** 15), name: '0.003 USDT' }
    ];

    for (const { amount, name } of betAmounts) {
        try {
            const current = await game.getCurrentGame(amount);
            console.log(`\n📊 Current Game for ${name}:`);
            console.log('  Game ID:', current[0].toString());
            console.log('  Player Count:', current[1].toString());
            console.log('  Start Time:', current[2] > 0 ? new Date(Number(current[2]) * 1000).toLocaleString() : 'Not started');
            console.log('  Can Join:', current[3]);

            // 如果有 gameId，尝试获取详细信息
            if (current[0] > 0) {
                const gameInfo = await game.getGame(current[0]);
                console.log('  Actual Players in Array:', gameInfo[2].length);
                
                if (Number(current[1]) !== gameInfo[2].length) {
                    console.log('  ❌ MISMATCH: getCurrentGame says', current[1].toString(), 'players, but getGame shows', gameInfo[2].length);
                } else {
                    console.log('  ✅ Player counts match!');
                }
            }
        } catch (error: any) {
            console.log(`\n❌ Error getting current game for ${name}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Test Summary');
    console.log('='.repeat(50));
    console.log('If you see "No players in array" but getCurrentGame shows players,');
    console.log('then the bug still exists and the contract needs to be upgraded.');
    console.log('');
    console.log('After upgrading, all methods should return the same player data.');
    console.log('='.repeat(50) + '\n');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
