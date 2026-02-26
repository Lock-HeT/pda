import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  
  console.log('\n========================================');
  console.log('Setting Up Upgradeable Contracts');
  console.log('========================================\n');

  // 获取已部署的合约
  const referralDeployment = await deployments.get('PDAReferral');
  const liquidityManagerDeployment = await deployments.get('PDALiquidityManager');
  const depositDeployment = await deployments.get('PDADeposit');
  const gameDeployment = await deployments.get('PDAGame');

  // 连接合约
  const referral = await ethers.getContractAt('PDAReferral', referralDeployment.address);
  const liquidityManager = await ethers.getContractAt('PDALiquidityManager', liquidityManagerDeployment.address);


  // 1. 授权入金合约到推荐关系合约
  console.log('1. Authorizing PDADepositUpgradeable in PDAReferral...');
  try {
    const tx1 = await referral.addAuthorizedContract(depositDeployment.address);
    console.log('   ✅ PDADepositUpgradeable authorized in PDAReferral');
  } catch (error: any) {
    console.log('   ⚠️  Already authorized or error:', error.message);
  }

  // 2. 授权游戏合约到推荐关系合约
  console.log('2. Authorizing PDAGameUpgradeable in PDAReferral...');
  try {
    const tx2 = await referral.addAuthorizedContract(gameDeployment.address);
    console.log('   ✅ PDAGameUpgradeable authorized in PDAReferral');
  } catch (error: any) {
    console.log('   ⚠️  Already authorized or error:', error.message);
  }

  // 3. 授权入金合约到流动性管理合约（来源0）
  console.log('3. Authorizing PDADepositUpgradeable in PDALiquidityManager (source=0)...');
  try {
    const tx3 = await liquidityManager.addAuthorizedContract(depositDeployment.address, 0);
    console.log('   ✅ PDADepositUpgradeable authorized in PDALiquidityManager (source=0)');
  } catch (error: any) {
    console.log('   ⚠️  Already authorized or error:', error.message);
  }

  // 4. 授权游戏合约到流动性管理合约（来源1）
  console.log('4. Authorizing PDAGameUpgradeable in PDALiquidityManager (source=1)...');
  try {
    await liquidityManager.addAuthorizedContract(gameDeployment.address, 1);
    console.log('   ✅ PDAGameUpgradeable authorized in PDALiquidityManager (source=1)');
  } catch (error: any) {
    console.log('   ⚠️  Already authorized or error:', error.message);
  }

  console.log('\n✅ All upgradeable contracts set up successfully!');
};

func.tags = ['setup-upgradeable'];

export default func;
