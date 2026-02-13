import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers} = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
/*
    console.log("开始部署 PDARecruitmentNFT 合约...");
    console.log("部署账户:", deployer);

    // BSC主网地址
    const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
    const TREASURY_ADDRESS_1 = '0xb680ad3b50143500a785388fa0a9dd084697ea5e';
    const TREASURY_ADDRESS_2 = '0xc53DDE6CEc19907182E129A1771dc35690c21890';

    const nftContract = await deploy("PDARecruitmentNFT", {
        from: deployer,
        args: [
            USDT_ADDRESS,
            TREASURY_ADDRESS_1,
            TREASURY_ADDRESS_2
        ],
        log: true,
        waitConfirmations: 1,
    });

    console.log("PDARecruitmentNFT 部署成功!");
    console.log("合约地址:", nftContract.address);*/
};

func.tags = ["PDARecruitmentNFT"];

export default func;
