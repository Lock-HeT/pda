import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {/*
    const { deployments, getNamedAccounts, ethers} = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("开始部署 Receiver 合约...");
    console.log("部署账户:", deployer);
    const signer = await ethers.getSigner(deployer);
    console.log("部署账户地址:", signer.address);


    const receiverContract = await deploy("Receiver", {
        from: deployer,
        args: [
            '0xf00a4E1bAdFd63d5d714EEFe90063b17d5B8caa6',
            '0xc9acad7CAbC5232d4f3169E3918BC49E000e600B'// 这里替换为实际的 EntryPoint 合约地址
        ],
        log: true,
        waitConfirmations: 1,
    });

    console.log("receiver 部署成功!");
    console.log("合约地址:", receiverContract.address);*/
};

func.tags = ["receiver"];

export default func;
