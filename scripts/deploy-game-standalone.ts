import { ethers, upgrades } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n========================================');
  console.log('Deploying PDAGame Contract (Standalone)');
  console.log('========================================\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('');

  // 配置地址 - 请根据实际情况修改
  const REFERRAL_ADDRESS = process.env.REFERRAL_ADDRESS || '0xYourReferralAddress';
  const LIQUIDITY_MANAGER_ADDRESS = process.env.LIQUIDITY_MANAGER_ADDRESS || '0xYourLiquidityManagerAddress';
  const OPERATION_ADDRESS = process.env.OPERATION_ADDRESS || '0xb680ad3b50143500a785388fa0a9dd084697ea5e';
  const DAPP_ADDRESS = process.env.DAPP_ADDRESS || deployer.address;

  console.log('Configuration:');
  console.log('  Referral Address:', REFERRAL_ADDRESS);
  console.log('  Liquidity Manager Address:', LIQUIDITY_MANAGER_ADDRESS);
  console.log('  Operation Address:', OPERATION_ADDRESS);
  console.log('  Dapp Address:', DAPP_ADDRESS);
  console.log('');

  // 验证地址
  if (REFERRAL_ADDRESS === '0xYourReferralAddress' || LIQUIDITY_MANAGER_ADDRESS === '0xYourLiquidityManagerAddress') {
    console.error('❌ Please set REFERRAL_ADDRESS and LIQUIDITY_MANAGER_ADDRESS environment variables');
    console.error('   or update the script with actual addresses');
    process.exit(1);
  }

  try {
    // 获取合约工厂
    console.log('Getting contract factory...');
    const PDAGame = await ethers.getContractFactory('PDAGame');
    console.log('✅ Contract factory loaded');
    console.log('');

    // 部署可升级合约（UUPS）
    console.log('Deploying proxy...');
    const game = await upgrades.deployProxy(
      PDAGame as any,
      [
        REFERRAL_ADDRESS,
        LIQUIDITY_MANAGER_ADDRESS,
        OPERATION_ADDRESS,
        DAPP_ADDRESS
      ],
      {
        kind: 'uups',
        initializer: 'initialize',
        timeout: 600000  // 10分钟超时
      }
    );

    console.log('Waiting for deployment...');
    await game.waitForDeployment();
    
    const proxyAddress = await game.getAddress();
    const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log('');
    console.log('✅ PDAGame deployment completed!');
    console.log(`   Proxy Address: ${proxyAddress}`);
    console.log(`   Implementation Address: ${implementation}`);
    console.log('');

    // 验证部署
    console.log('Verifying deployment...');
    const gameContract = await ethers.getContractAt('PDAGame', proxyAddress);
    
    try {
      const owner = await gameContract.owner();
      console.log('   Owner:', owner);
      
      const usdt = await gameContract.USDT();
      console.log('   USDT:', usdt);
      
      const referralContract = await gameContract.referralContract();
      console.log('   Referral Contract:', referralContract);
      
      const liquidityManager = await gameContract.liquidityManager();
      console.log('   Liquidity Manager:', liquidityManager);
      
      const gameType100 = await gameContract.GAME_TYPE_100();
      console.log('   Game Type 100:', ethers.formatUnits(gameType100, 18), 'USDT');
      
      const playersPerGame = await gameContract.PLAYERS_PER_GAME();
      console.log('   Players Per Game:', playersPerGame.toString());
      
      console.log('✅ Deployment verification passed');
    } catch (error: any) {
      console.error('❌ Deployment verification failed:', error.message);
    }
    console.log('');

    // 保存部署信息到文件
    const deploymentInfo = {
      network: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      proxyAddress: proxyAddress,
      implementationAddress: implementation,
      deployer: deployer.address,
      referralAddress: REFERRAL_ADDRESS,
      liquidityManagerAddress: LIQUIDITY_MANAGER_ADDRESS,
      operationAddress: OPERATION_ADDRESS,
      dappAddress: DAPP_ADDRESS,
      deployedAt: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };

    const deploymentsDir = path.join(__dirname, '..', 'deployments-info');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `PDAGame-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📝 Deployment info saved to: ${filepath}`);
    console.log('');

    console.log('========================================');
    console.log('Next Steps');
    console.log('========================================');
    console.log('1. Authorize PDAGame contract in PDAReferral:');
    console.log(`   referral.addAuthorizedContract("${proxyAddress}")`);
    console.log('');
    console.log('2. Authorize PDAGame contract in PDALiquidityManager:');
    console.log(`   liquidityManager.addAuthorizedContract("${proxyAddress}", 1)`);
    console.log('');
    console.log('3. Set game operator:');
    console.log(`   game.setGameOperator("0xOperatorAddress")`);
    console.log('');
    console.log('4. Verify contract on BscScan:');
    console.log(`   https://bscscan.com/address/${proxyAddress}#code`);
    console.log('========================================\n');

  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
