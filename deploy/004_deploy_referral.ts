import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from './001_deploy_utils';
import {ethers} from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  
  console.log('\n========================================');
  console.log('Deploying PDAReferral Contract');
  console.log('========================================\n');

  const activeUserManager = '0xa5Ed7a4deF1B6a6EE44250f19411F4ab084b7274';
  // 部署推荐关系合约
  const referral = await deployContract(
    hre,
    'PDAReferral',
    [activeUserManager],
    1
  );

  console.log('\n✅ PDAReferral deployed successfully!');
  console.log(`Address: ${referral.address}`);
};

func.tags = ['PDAReferral'];

export default func;
