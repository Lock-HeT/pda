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

     const burnReceiveAddress= '0x7E4a21d64afD8F11C41D153ce478A404b1169969';

     const tokenDeployment = await deployContract(
          hre,
          'PDA',
          [burnReceiveAddress, '0xc8DF60C860Cf7A440852cAf91f9a39bA3c362378', '0x8E3b1de34531AFdA25E758Cb349367513d4F0d6A', '0xa5Ed7a4deF1B6a6EE44250f19411F4ab084b7274']
     );

     console.log('✅ PDA.sol deployment completed!');
     console.log(`   PDA Address: ${tokenDeployment.address}`);

     const whiteAddress = '0x7c27D612B9db246d4830eAA5eA1e8fE3C9593cdd';
     const pdaContract = await hre.ethers.getContractAt('PDA', tokenDeployment.address);
     const tx = await pdaContract.addWhiteList(whiteAddress);
     const receipt = await (tx as any).wait();
     console.log(` AddWhiteList  Transaction hash: ${receipt?.hash || receipt?.transactionHash}`);

     //转账
     // 210 million tokens with 18 decimals 注意ts精度
     const initialAmount = BigInt(210_000_000) * BigInt(10 ** 18);
     const transferTx = await pdaContract.transfer(whiteAddress, initialAmount);
     const transferReceipt = await (transferTx as any).wait();
     console.log(` Transfer  Transaction hash: ${transferReceipt?.hash || transferReceipt?.transactionHash}`);

};

func.tags = ['PDA'];
export default func;
