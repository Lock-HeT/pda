import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { ContractFactory } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deployer } = await getNamedAccounts();
  
  console.log('\n========================================');
  console.log('Deploying PDAGame Contract (UUPS)');
  console.log('========================================\n');

  try {
    // 获取已部署的合约地址
    let referralAddress: string;
    let liquidityManagerAddress: string;
    
    try {
      const referralDeployment = await deployments.get('PDAReferral');
      referralAddress = referralDeployment.address;
    } catch (error) {
      console.log('⚠️  Using referral address from env/fallback:');
      return;
    }
    
    try {
      const liquidityManagerDeployment = await deployments.get('PDALiquidityManager');
      liquidityManagerAddress = liquidityManagerDeployment.address;
    } catch (error) {
      console.log('⚠️  Using liquidity manager address from env/fallback:');
      return;
    }

    //TODO
    const operationAddress = '0xc53DDE6CEc19907182E129A1771dc35690c21890';
    const dappAddress = '0xb680ad3b50143500a785388fa0a9dd084697ea5e';
    const gameOperateAddress = '0xb680ad3b50143500a785388fa0a9dd084697ea5e';

    // 获取合约工厂
    const PDAGame = (await ethers.getContractFactory('PDAGame'))as unknown as ContractFactory;

    console.log('Deployment parameters:');
    console.log('  Referral Address:', referralAddress);
    console.log('  Liquidity Manager Address:', liquidityManagerAddress);
    console.log('  Operation Address:', operationAddress);
    console.log('  Dapp Address:', dappAddress);
    console.log('');

    // 部署可升级合约（UUPS）
    console.log('   Deploying proxy...');
    const game = await upgrades.deployProxy(
      PDAGame,
      [
        referralAddress,
        liquidityManagerAddress,
        operationAddress,
        dappAddress,
        gameOperateAddress
      ],
      {
        kind: 'uups',
        initializer: 'initialize',
      }
    );

    // 只有在新部署时才处理交易回执
    let receipt: any = undefined;
    const tx = game.deploymentTransaction();
    if (tx) {
      const txReceipt = await tx.wait();
      if (txReceipt) {
        receipt = {
          transactionHash: txReceipt.hash,
          transactionIndex: txReceipt.index,
          blockHash: txReceipt.blockHash,
          blockNumber: txReceipt.blockNumber,
          gasUsed: txReceipt.gasUsed,
          from: tx.from,
          cumulativeGasUsed: txReceipt.gasUsed,
        };
      }
    }

    await game.waitForDeployment();
    const proxyAddress = await game.getAddress();
    const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log('✅  deployment completed!');
    console.log(`   Proxy Address: ${proxyAddress}`);
    console.log(`   Implementation Address: ${implementation}`);

    // 保存为 hardhat-deploy deployment 文件
    const artifact = await deployments.getArtifact('PDAGame');

    await deployments.save('PDAGame', {
      abi: artifact.abi,
      address: proxyAddress,
      receipt,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      implementation,
    });

    try {
      const buildInfoDir = path.join(__dirname, '..', 'artifacts', 'build-info');
      const outputDir = path.join(__dirname, '..', 'deployments', 'solcInputs');

      if (fs.existsSync(buildInfoDir)) {
        const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith('.json'));
        let chosen: any | null = null;

        for (const file of files) {
          const fullPath = path.join(buildInfoDir, file);
          const raw = fs.readFileSync(fullPath, 'utf8');
          try {
            const json = JSON.parse(raw);
            const input = json.input;
            if (input && input.sources && input.sources['contracts/PDAGame.sol']) {
              chosen = input;
              break;
            }
          } catch {
            // ignore parse error
          }
        }

        if (chosen) {
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          const outPath = path.join(outputDir, 'PDAGame.json');
          fs.writeFileSync(outPath, JSON.stringify(chosen, null, 2));
          console.log(`   🧾 Solc input exported to: ${outPath}`);
        } else {
          console.warn('   ⚠️  Could not find build-info, skip solcInputs export.');
        }
      } else {
        console.warn('   ⚠️  build-info directory not found, skip solcInputs export.');
      }
    } catch (e) {
      console.warn('   ⚠️  Failed to export solcInputs:', e);
    }

  } catch (error: any) {
    console.error('❌ 部署失败:', error);
    throw error;
  }
};

func.tags = ['PDAGame'];

export default func;
