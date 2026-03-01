import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployContract} from './001_deploy_utils';
import dotenv from 'dotenv';
import {ContractTransaction} from "ethers";

dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
     console.log('🚀 Deploying PDA.sol...');
     const { deployments, getNamedAccounts } = hre;
     const { deployer } = await getNamedAccounts();

     const burnAddress= '0xb680ad3b50143500a785388fa0a9dd084697ea5e';

     //TODO: 替换为实际的参数
     const tokenDeployment = await deployContract(
          hre,
          'PDA',
          [burnAddress, '0xc53DDE6CEc19907182E129A1771dc35690c21890', '0x1e0f55df4f48a6008ac848f7a3e2587ccdba2305', burnAddress]
     );

     console.log('✅ PDA.sol deployment completed!');
     console.log(`   PDA Address: ${tokenDeployment.address}`);

     // TODO: 添加白名单地址
     const whiteAddress = '0x1AfA2bFA88a90AC0E51A20ABD556E05574d33e6c';
     const pdaContract = await hre.ethers.getContractAt('PDA', tokenDeployment.address);
     const tx = await pdaContract.addWhiteList(whiteAddress);
     const receipt = await (tx as any).wait();
     console.log(` AddWhiteList  Transaction hash: ${receipt?.hash || receipt?.transactionHash}`);

     //转账
     const transferTx = await pdaContract.transfer(whiteAddress, BigInt(200000000 * 10**18));
     const transferReceipt = await (transferTx as any).wait();
     console.log(` Transfer  Transaction hash: ${transferReceipt?.hash || transferReceipt?.transactionHash}`);

};

func.tags = ['PDA'];
export default func;
