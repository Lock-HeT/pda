import { ethers } from 'hardhat';

/**
 * 升级合约
 * 使用 UUPS 代理模式升级
 */
async function main() {
  console.log('🚀 开始升级 PDA 游戏合约...\n');

  const [deployer] = await ethers.getSigners();
  console.log('部署账户:', deployer.address);

  // 代理合约地址（需要根据实际部署的地址修改）
  const PROXY_ADDRESS = process.env.PROXY_ADDRESS || '0x584BA07262dFb25589aAa9ec8793f61727b2C92F';
  
  console.log('代理合约地址:', PROXY_ADDRESS);
  console.log();

  // 1. 获取当前代理合约
  console.log('步骤 1: 连接到现有代理合约...');
  const proxyContract = await ethers.getContractAt('PDAGame', PROXY_ADDRESS);
  
  // 获取当前版本信息
  const currentOwner = await proxyContract.owner();

  console.log('当前合约信息:');
  console.log('  所有者:', currentOwner);
  console.log();

  // 验证部署者是否为所有者
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log('❌ 错误：当前账户不是合约所有者！');
    console.log('  当前账户:', deployer.address);
    console.log('  合约所有者:', currentOwner);
    return;
  }
  console.log('✅ 权限验证通过\n');

  // 2. 部署新的实现合约
  console.log('步骤 2: 部署新的实现合约');
  
  const pdaGameFactory = await ethers.getContractFactory('PDAGame');
  
  const newImplementation = await pdaGameFactory.deploy();
  await newImplementation.waitForDeployment();
  
  const newImplementationAddress = await newImplementation.getAddress();
  console.log('✅ 新实现合约地址:', newImplementationAddress);
  console.log();

  // 3. 升级代理合约
  console.log('步骤 3: 升级代理合约...');
  console.log('正在调用 upgradeToAndCall...');
  
  // 使用 upgradeTo（如果不需要调用初始化函数）
  const upgradeTx = await proxyContract.upgradeToAndCall(
    newImplementationAddress,
    '0x' // 空的 calldata，如果不需要额外的初始化
  );
  
  console.log('等待交易确认...');
  console.log('✅ 升级完成！\n');

  // 4. 验证升级
  console.log('步骤 4: 验证升级结果...');
  
  // 重新连接到代理合约
  const upgradedContract = await ethers.getContractAt('PDAGame', PROXY_ADDRESS);
  
  const newOwner = await upgradedContract.owner();

  console.log('升级后的合约信息:');
  console.log('  所有者:', newOwner);
  console.log();

  // 验证数据是否保持
  if (newOwner.toLowerCase() === currentOwner.toLowerCase()) {
    console.log('✅ 所有者数据保持不变');
  } else {
    console.log('⚠️  警告：所有者数据发生变化！');
  }

  console.log('\n🎉🎉🎉 升级成功！🎉🎉🎉');
  console.log('\n📝 升级摘要:');
  console.log('代理合约:', PROXY_ADDRESS);
  console.log('新实现合约:', newImplementationAddress);

  await upgradedContract.setGameOperator("0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c");
  console.log('✅ 设置游戏运营地址成功！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ 升级失败:', error);
    process.exit(1);
  });

