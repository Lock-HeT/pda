import { ethers, upgrades } from 'hardhat';

async function main() {
  console.log('\n========================================');
  console.log('Upgrading PDADepositUpgradeable Contract');
  console.log('========================================\n');

  // 获取当前代理地址（从部署记录中获取）
  const PROXY_ADDRESS = process.env.DEPOSIT_PROXY_ADDRESS || '';
  
  if (!PROXY_ADDRESS) {
    console.error('❌ Please set DEPOSIT_PROXY_ADDRESS environment variable');
    process.exit(1);
  }

  console.log(`Proxy Address: ${PROXY_ADDRESS}`);
  console.log('');

  // 获取当前实现地址
  const currentImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log(`Current Implementation: ${currentImplementation}`);
  console.log('');

  // 获取新的合约工厂
  const PDADepositUpgradeableV2 = await ethers.getContractFactory('PDADeposit');

  // 首先尝试导入现有的代理（如果未注册）
  console.log('Importing existing proxy...');
  try {
    await upgrades.forceImport(PROXY_ADDRESS, PDADepositUpgradeableV2 as any, { kind: 'uups' });
    console.log('✅ Proxy imported successfully');
  } catch (error: any) {
    console.log('⚠️  Proxy already imported or error:', error.message);
  }
  console.log('');

  // 验证升级兼容性
  console.log('Validating upgrade...');
  try {
    await upgrades.validateUpgrade(PROXY_ADDRESS, PDADepositUpgradeableV2 as any, { kind: 'uups' });
    console.log('✅ Upgrade validation passed');
  } catch (error) {
    console.error('❌ Upgrade validation failed:', error);
    process.exit(1);
  }
  console.log('');

  // 执行升级
  console.log('Upgrading contract...');
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, PDADepositUpgradeableV2 as any, { kind: 'uups' });
  await upgraded.waitForDeployment();

  const newImplementation = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  
  console.log('✅ Upgrade completed!');
  console.log(`   Proxy Address: ${PROXY_ADDRESS}`);
  console.log(`   Old Implementation: ${currentImplementation}`);
  console.log(`   New Implementation: ${newImplementation}`);
  console.log('');

  // 验证升级后的合约
  console.log('Verifying upgraded contract...');
  const deposit = await ethers.getContractAt('PDADeposit', PROXY_ADDRESS);
  
  try {
    const version = await (deposit as any).version();
    console.log(`   Contract Version: ${version}`);
    
    const owner = await deposit.owner();
    console.log(`   Owner: ${owner}`);
    
    const usdt = await deposit.USDT();
    console.log(`   USDT: ${usdt}`);
    
    console.log('✅ Contract verification passed');
  } catch (error) {
    console.error('❌ Contract verification failed:', error);
  }
  console.log('');

  console.log('========================================');
  console.log('Upgrade Summary');
  console.log('========================================');
  console.log(`Proxy:              ${PROXY_ADDRESS}`);
  console.log(`Old Implementation: ${currentImplementation}`);
  console.log(`New Implementation: ${newImplementation}`);
  console.log('========================================\n');

  console.log('⚠️  Next steps:');
  console.log('  1. Verify the new implementation on BscScan');
  console.log('  2. Test all functions to ensure they work correctly');
  console.log('  3. Monitor the contract for any issues');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
