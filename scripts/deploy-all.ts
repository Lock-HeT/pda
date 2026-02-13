import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n========================================');
  console.log('PDA Contracts Deployment Script');
  console.log('========================================\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'BNB\n');

  // 网络配置
  const network = await ethers.provider.getNetwork();
  console.log('Network:', network.name);
  console.log('Chain ID:', network.chainId.toString());
  console.log('');

  // 配置地址
  let USDT: string;
  let ROUTER: string;
  let LP_TOKEN: string;
  let operationAddress: string;
  let dappAddress: string;

  if (network.chainId === 56n) {
    // BSC主网
    USDT = '0x55d398326f99059fF775485246999027B3197955';
    ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
    LP_TOKEN = '0x0000000000000000000000000000000000000000'; // 需要替换
    operationAddress = deployer.address; // 需要替换
    dappAddress = deployer.address; // 需要替换
  } else if (network.chainId === 97n) {
    // BSC测试网
    USDT = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';
    ROUTER = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
    LP_TOKEN = '0x0000000000000000000000000000000000000000'; // 需要替换
    operationAddress = deployer.address;
    dappAddress = deployer.address;
  } else {
    // 本地测试
    USDT = '0x0000000000000000000000000000000000000001';
    ROUTER = '0x0000000000000000000000000000000000000002';
    LP_TOKEN = '0x0000000000000000000000000000000000000003';
    operationAddress = deployer.address;
    dappAddress = deployer.address;
  }

  // 获取PDA地址（假设已部署）
  let PDA: string;
  try {
    const pdaDeployment = JSON.parse(
      fs.readFileSync(path.join(__dirname, `../deployments/${network.name}/PDA.json`), 'utf8')
    );
    PDA = pdaDeployment.address;
    console.log('Found existing PDA deployment:', PDA);
  } catch {
    console.log('⚠️  PDA not found, please deploy PDA token first');
    process.exit(1);
  }

  console.log('\nConfiguration:');
  console.log('  USDT:', USDT);
  console.log('  PDA:', PDA);
  console.log('  ROUTER:', ROUTER);
  console.log('  LP_TOKEN:', LP_TOKEN);
  console.log('  Operation Address:', operationAddress);
  console.log('  Dapp Address:', dappAddress);
  console.log('');

  if (LP_TOKEN === '0x0000000000000000000000000000000000000000') {
    console.log('⚠️  Warning: LP_TOKEN not set!');
    console.log('   Please create PDA-USDT liquidity pool first and update LP_TOKEN address');
    console.log('');
  }

  const deployments: any = {};

  // 1. 部署PDAReferral
  console.log('1. Deploying PDAReferral...');
  const PDAReferral = await ethers.getContractFactory('PDAReferral');
  const referral = await PDAReferral.deploy();
  await referral.waitForDeployment();
  deployments.PDAReferral = await referral.getAddress();
  console.log('   ✅ PDAReferral deployed:', deployments.PDAReferral);
  console.log('');

  // 2. 部署PDALiquidityManager
  console.log('2. Deploying PDALiquidityManager...');
  const PDALiquidityManager = await ethers.getContractFactory('PDALiquidityManager');
  const liquidityManager = await PDALiquidityManager.deploy(
    USDT,
    PDA,
    ROUTER,
    LP_TOKEN
  );
  await liquidityManager.waitForDeployment();
  deployments.PDALiquidityManager = await liquidityManager.getAddress();
  console.log('   ✅ PDALiquidityManager deployed:', deployments.PDALiquidityManager);
  console.log('');

  // 3. 部署PDADeposit
  console.log('3. Deploying PDADeposit...');
  const PDADeposit = await ethers.getContractFactory('PDADeposit');
  const deposit = await PDADeposit.deploy(
    USDT,
    deployments.PDAReferral,
    deployments.PDALiquidityManager,
    operationAddress,
    dappAddress
  );
  await deposit.waitForDeployment();
  deployments.PDADeposit = await deposit.getAddress();
  console.log('   ✅ PDADeposit deployed:', deployments.PDADeposit);
  console.log('');

  // 4. 部署PDAGame
  console.log('4. Deploying PDAGame...');
  const PDAGame = await ethers.getContractFactory('PDAGame');
  const game = await PDAGame.deploy(
    USDT,
    deployments.PDAReferral,
    deployments.PDALiquidityManager,
    operationAddress,
    dappAddress
  );
  await game.waitForDeployment();
  deployments.PDAGame = await game.getAddress();
  console.log('   ✅ PDAGame deployed:', deployments.PDAGame);
  console.log('');

  // 5. 配置授权
  console.log('5. Setting up authorizations...');
  
  console.log('   5.1. Authorizing PDADeposit in PDAReferral...');
  let tx = await referral.addAuthorizedContract(deployments.PDADeposit);
  await tx.wait();
  console.log('       ✅ Done');

  console.log('   5.2. Authorizing PDAGame in PDAReferral...');
  tx = await referral.addAuthorizedContract(deployments.PDAGame);
  await tx.wait();
  console.log('       ✅ Done');

  console.log('   5.3. Authorizing PDADeposit in PDALiquidityManager (source=0)...');
  tx = await liquidityManager.addAuthorizedContract(deployments.PDADeposit, 0);
  await tx.wait();
  console.log('       ✅ Done');

  console.log('   5.4. Authorizing PDAGame in PDALiquidityManager (source=1)...');
  tx = await liquidityManager.addAuthorizedContract(deployments.PDAGame, 1);
  await tx.wait();
  console.log('       ✅ Done');
  console.log('');

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployments,
    config: {
      USDT,
      PDA,
      ROUTER,
      LP_TOKEN,
      operationAddress,
      dappAddress
    }
  };

  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentDir, `deployment-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log('========================================');
  console.log('Deployment Summary');
  console.log('========================================');
  console.log('PDAReferral:        ', deployments.PDAReferral);
  console.log('PDALiquidityManager:', deployments.PDALiquidityManager);
  console.log('PDADeposit:         ', deployments.PDADeposit);
  console.log('PDAGame:            ', deployments.PDAGame);
  console.log('========================================');
  console.log('');
  console.log('Deployment info saved to:', deploymentFile);
  console.log('');

  console.log('⚠️  Next steps:');
  console.log('  1. Create PDA-USDT liquidity pool if not done');
  console.log('  2. Update LP_TOKEN address in PDALiquidityManager if needed');
  console.log('  3. Update operation and dapp addresses if needed');
  console.log('  4. Verify contracts on BscScan');
  console.log('  5. Test all functions');
  console.log('');

  console.log('Verify commands:');
  console.log(`npx hardhat verify --network ${network.name} ${deployments.PDAReferral}`);
  console.log(`npx hardhat verify --network ${network.name} ${deployments.PDALiquidityManager} "${USDT}" "${PDA}" "${ROUTER}" "${LP_TOKEN}"`);
  console.log(`npx hardhat verify --network ${network.name} ${deployments.PDADeposit} "${USDT}" "${deployments.PDAReferral}" "${deployments.PDALiquidityManager}" "${operationAddress}" "${dappAddress}"`);
  console.log(`npx hardhat verify --network ${network.name} ${deployments.PDAGame} "${USDT}" "${deployments.PDAReferral}" "${deployments.PDALiquidityManager}" "${operationAddress}" "${dappAddress}"`);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
