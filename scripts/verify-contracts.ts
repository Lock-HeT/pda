import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n========================================');
  console.log('Contract Verification Script');
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

  console.log('Using deployment from:', latestDeployment.timestamp);
  console.log('Network:', latestDeployment.network);
  console.log('');

  const { contracts, config } = latestDeployment;

  // 验证PDAReferral
  console.log('1. Verifying PDAReferral...');
  try {
    await run('verify:verify', {
      address: contracts.PDAReferral,
      constructorArguments: []
    });
    console.log('   ✅ PDAReferral verified');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('   ℹ️  Already verified');
    } else {
      console.log('   ❌ Error:', error.message);
    }
  }
  console.log('');

  // 验证PDALiquidityManager
  console.log('2. Verifying PDALiquidityManager...');
  try {
    await run('verify:verify', {
      address: contracts.PDALiquidityManager,
      constructorArguments: [
        config.USDT,
        config.PDA,
        config.ROUTER,
        config.LP_TOKEN
      ]
    });
    console.log('   ✅ PDALiquidityManager verified');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('   ℹ️  Already verified');
    } else {
      console.log('   ❌ Error:', error.message);
    }
  }
  console.log('');

  // 验证PDADeposit
  console.log('3. Verifying PDADeposit...');
  try {
    await run('verify:verify', {
      address: contracts.PDADeposit,
      constructorArguments: [
        config.USDT,
        contracts.PDAReferral,
        contracts.PDALiquidityManager,
        config.operationAddress,
        config.dappAddress
      ]
    });
    console.log('   ✅ PDADeposit verified');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('   ℹ️  Already verified');
    } else {
      console.log('   ❌ Error:', error.message);
    }
  }
  console.log('');

  // 验证PDAGame
  console.log('4. Verifying PDAGame...');
  try {
    await run('verify:verify', {
      address: contracts.PDAGame,
      constructorArguments: [
        config.USDT,
        contracts.PDAReferral,
        contracts.PDALiquidityManager,
        config.operationAddress,
        config.dappAddress
      ]
    });
    console.log('   ✅ PDAGame verified');
  } catch (error: any) {
    if (error.message.includes('Already Verified')) {
      console.log('   ℹ️  Already verified');
    } else {
      console.log('   ❌ Error:', error.message);
    }
  }
  console.log('');

  console.log('========================================');
  console.log('Verification Complete');
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
