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
  console.log('Deploying PDADeposit Contract (UUPS)');
  console.log('========================================\n');

  try {
    // 获取已部署的合约地址
    const referralDeployment = await deployments.get('PDAReferral');
    const liquidityManagerDeployment = await deployments.get('PDALiquidityManager');

    const operationAddress = '0xb680ad3b50143500a785388fa0a9dd084697ea5e';
    const dappAddress = deployer;

    // 获取合约工厂
    const PDADeposit = (await ethers.getContractFactory('PDADeposit'))as unknown as ContractFactory;

    // 检查是否已经部署
    let deposit;
    let proxyAddress;
    
    try {
      const existingDeployment = await deployments.get('PDADeposit');
      proxyAddress = existingDeployment.address;
      
      console.log('   Existing proxy found, importing...');
      // 使用 forceImport 导入已存在的代理
      await upgrades.forceImport(proxyAddress, PDADeposit, { kind: 'uups' });
      deposit = await ethers.getContractAt('PDADeposit', proxyAddress);
      console.log('   ✅ Proxy imported successfully');
      console.log(`   Proxy Address: ${proxyAddress}`);
      
      // 如果只是导入，直接返回
      return true;
    } catch (e) {
      // 如果不存在，则部署新的代理
      console.log('   No existing proxy found, deploying new proxy...');
      deposit = await upgrades.deployProxy(
        PDADeposit,
        [
          referralDeployment.address,
          liquidityManagerDeployment.address,
          operationAddress,
          dappAddress
        ],
        {
          kind: 'uups',
          initializer: 'initialize',
        }
      );
    }

    // 只有在新部署时才处理交易回执
    let receipt: any = undefined;
    const tx = deposit.deploymentTransaction();
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

    await deposit.waitForDeployment();
    proxyAddress = await deposit.getAddress();
    const implementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);

    console.log('✅ PDADeposit deployment completed!');
    console.log(`   Proxy Address: ${proxyAddress}`);
    console.log(`   Implementation Address: ${implementation}`);

    // 保存为 hardhat-deploy deployment 文件
    const artifact = await deployments.getArtifact('PDADeposit');

    await deployments.save('PDADeposit', {
      abi: artifact.abi,
      address: proxyAddress,
      receipt,
      bytecode: artifact.bytecode,
      deployedBytecode: artifact.deployedBytecode,
      implementation,
    });

    // 导出 solc input
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
            if (input && input.sources && input.sources['contracts/PDADeposit.sol']) {
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
          const outPath = path.join(outputDir, 'PDADeposit.json');
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

func.tags = ['PDADeposit'];
func.dependencies = ['PDAReferral', 'PDALiquidityManager'];

export default func;
