import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from './001_deploy_utils';
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, network } = hre;
  
  console.log('\n========================================');
  console.log('Deploying PDALiquidityManager Contract');
  console.log('========================================\n');

  const pdaDeployment = await deployments.get('PDA');


  const liquidityManager = await deployContract(
    hre,
    'PDALiquidityManager',
    [
      pdaDeployment.address,
    ],
    1
  );

  console.log('\n✅ PDALiquidityManager deployed successfully!');
  console.log(`Address: ${liquidityManager.address}`);

  const pdaToken = await ethers.getContractAt('PDA', pdaDeployment.address);
  await pdaToken.addWhiteList(liquidityManager.address);
  console.log('set white success');
};

func.tags = ['PDALiquidityManager'];
func.dependencies = ['PDA']; // 依赖PDA代币

export default func;
