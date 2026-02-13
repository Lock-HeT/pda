import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployContract} from './001_deploy_utils';
import dotenv from 'dotenv';

dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
     console.log('🚀 Deploying PDA.sol...');
     const { deployments, getNamedAccounts } = hre;
     const { deployer } = await getNamedAccounts();

     const tokenDeployment = await deployContract(
          hre,
          'PDA',
          ['0x1e0f55df4f48a6008ac848f7a3e2587ccdba2305']
     );

     console.log('✅ PDA.sol deployment completed!');
     console.log(`   PDA Address: ${tokenDeployment.address}`);

};

func.tags = ['PDA'];
export default func;
