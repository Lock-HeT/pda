import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n========================================');
  console.log('Deployment Status Check');
  console.log('========================================\n');

  // 读取最新的部署信息
  const deploymentDir = path.join(__dirname, '../deployments');
  const files = fs.readdirSync(deploymentDir)
    .filter(f => f.startsWith('deployment-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('❌ No deployment files found');
    process.exit(1);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentDir, files[0]), 'utf8')
  );

  console.log('Deployment Info:');
  console.log('  Time:', latestDeployment.timestamp);
  console.log('  Network:', latestDeployment.network);
  console.log('  Deployer:', latestDeployment.deployer);
  console.log('');

  const { contracts } = latestDeployment;

  // 连接合约
  const referral = await ethers.getContractAt('PDAReferral', contracts.PDAReferral);
  const liquidityManager = await ethers.getContractAt('PDALiquidityManager', contracts.PDALiquidityManager);
  const deposit = await ethers.getContractAt('PDADeposit', contracts.PDADeposit);
  const game = await ethers.getContractAt('PDAGame', contracts.PDAGame);

  console.log('========================================');
  console.log('1. Contract Addresses');
  console.log('========================================');
  console.log('PDAReferral:        ', contracts.PDAReferral);
  console.log('PDALiquidityManager:', contracts.PDALiquidityManager);
  console.log('PDADeposit:         ', contracts.PDADeposit);
  console.log('PDAGame:            ', contracts.PDAGame);
  console.log('');

  console.log('========================================');
  console.log('2. Authorization Status');
  console.log('========================================');
  
  // 检查推荐关系合约授权
  const depositAuthInReferral = await referral.authorizedContracts(contracts.PDADeposit);
  const gameAuthInReferral = await referral.authorizedContracts(contracts.PDAGame);
  console.log('PDAReferral:');
  console.log('  PDADeposit authorized:', depositAuthInReferral ? '✅' : '❌');
  console.log('  PDAGame authorized:   ', gameAuthInReferral ? '✅' : '❌');
  console.log('');

  // 检查流动性管理合约授权
  const depositAuthInLM = await liquidityManager.authorizedContracts(contracts.PDADeposit);
  const gameAuthInLM = await liquidityManager.authorizedContracts(contracts.PDAGame);
  const depositSource = await liquidityManager.contractSource(contracts.PDADeposit);
  const gameSource = await liquidityManager.contractSource(contracts.PDAGame);
  console.log('PDALiquidityManager:');
  console.log('  PDADeposit authorized:', depositAuthInLM ? '✅' : '❌', `(source: ${depositSource})`);
  console.log('  PDAGame authorized:   ', gameAuthInLM ? '✅' : '❌', `(source: ${gameSource})`);
  console.log('');

  console.log('========================================');
  console.log('3. Contract Configurations');
  console.log('========================================');
  
  // 检查入金合约配置
  console.log('PDADeposit:');
  console.log('  Owner:              ', await deposit.owner());
  console.log('  USDT:               ', await deposit.USDT());
  console.log('  Referral Contract:  ', await deposit.referralContract());
  console.log('  Liquidity Manager:  ', await deposit.liquidityManager());
  console.log('  Operation Address:  ', await deposit.operationAddress());
  console.log('  Dapp Address:       ', await deposit.dappAddress());
  console.log('  Min Deposit:        ', ethers.formatUnits(await deposit.MIN_DEPOSIT(), 18), 'USDT');
  console.log('  Max Deposit:        ', ethers.formatUnits(await deposit.MAX_DEPOSIT(), 18), 'USDT');
  console.log('');

  // 检查游戏合约配置
  console.log('PDAGame:');
  console.log('  Owner:              ', await game.owner());
  console.log('  USDT:               ', await game.USDT());
  console.log('  Referral Contract:  ', await game.referralContract());
  console.log('  Liquidity Manager:  ', await game.liquidityManager());
  console.log('  Operation Address:  ', await game.operationAddress());
  console.log('  Dapp Address:       ', await game.dappAddress());
  console.log('  Game Types:');
  console.log('    Type 0:           ', ethers.formatUnits(await game.gameTypes(0), 18), 'USDT');
  console.log('    Type 1:           ', ethers.formatUnits(await game.gameTypes(1), 18), 'USDT');
  console.log('    Type 2:           ', ethers.formatUnits(await game.gameTypes(2), 18), 'USDT');
  console.log('  Players per Game:   ', (await game.PLAYERS_PER_GAME()).toString());
  console.log('  Game Timeout:       ', (await game.GAME_TIMEOUT()).toString(), 'seconds');
  console.log('');

  // 检查流动性管理合约状态
  console.log('PDALiquidityManager:');
  console.log('  Owner:              ', await liquidityManager.owner());
  console.log('  USDT:               ', await liquidityManager.USDT());
  console.log('  PDA:                ', await liquidityManager.PDA());
  console.log('  ROUTER:             ', await liquidityManager.ROUTER());
  console.log('  LP_TOKEN:           ', await liquidityManager.LP_TOKEN());
  console.log('  Current Day:        ', (await liquidityManager.getCurrentDay()).toString());
  console.log('  Total LP Locked:    ', ethers.formatUnits(await liquidityManager.totalLPLocked(), 18));
  console.log('  Total PDA Burned:   ', ethers.formatUnits(await liquidityManager.totalPDABurned(), 18));
  console.log('');

  console.log('========================================');
  console.log('4. Health Check');
  console.log('========================================');
  
  let issues = 0;

  // 检查授权
  if (!depositAuthInReferral) {
    console.log('❌ PDADeposit not authorized in PDAReferral');
    issues++;
  }
  if (!gameAuthInReferral) {
    console.log('❌ PDAGame not authorized in PDAReferral');
    issues++;
  }
  if (!depositAuthInLM) {
    console.log('❌ PDADeposit not authorized in PDALiquidityManager');
    issues++;
  }
  if (!gameAuthInLM) {
    console.log('❌ PDAGame not authorized in PDALiquidityManager');
    issues++;
  }

  // 检查来源映射
  if (depositSource !== 0n) {
    console.log('⚠️  PDADeposit source should be 0, got:', depositSource.toString());
    issues++;
  }
  if (gameSource !== 1n) {
    console.log('⚠️  PDAGame source should be 1, got:', gameSource.toString());
    issues++;
  }

  // 检查LP地址
  const lpToken = await liquidityManager.LP_TOKEN();
  if (lpToken === '0x0000000000000000000000000000000000000000') {
    console.log('⚠️  LP_TOKEN not set in PDALiquidityManager');
    issues++;
  }

  if (issues === 0) {
    console.log('✅ All checks passed!');
  } else {
    console.log(`\n⚠️  Found ${issues} issue(s)`);
  }
  console.log('');

  console.log('========================================');
  console.log('5. Suggested Actions');
  console.log('========================================');
  
  if (lpToken === '0x0000000000000000000000000000000000000000') {
    console.log('1. Create PDA-USDT liquidity pool on PancakeSwap');
    console.log('2. Update LP_TOKEN address:');
    console.log('   await liquidityManager.setLPToken("<LP_TOKEN_ADDRESS>")');
  }
  
  console.log('3. Test basic functions:');
  console.log('   - Bind referrer');
  console.log('   - Make a deposit');
  console.log('   - Join a game');
  console.log('   - Remove liquidity');
  
  console.log('4. Update addresses if needed:');
  console.log('   - Operation address');
  console.log('   - Dapp address');
  
  console.log('5. Verify contracts on BscScan');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
