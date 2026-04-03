import { ethers } from "hardhat";

// ========== 配置 ==========
const RECEIVER_CONTRACT = "0x"; // TODO: 填入 Receiver 合约地址
const WITHDRAWER_PRIVATE_KEY = process.env.WITHDRAWER_PRIVATE_KEY || ""; // withdrawer 私钥

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // BSC USDT
const AMOUNT = ethers.parseUnits("1000", 18); // 1000 USDT

const RECEIVER_ABI = [
    "function withdraw() external",
    "function withdrawer() view returns (address)",
    "function recipient() view returns (address)",
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
];

async function main() {
    const provider = ethers.provider;

    // 打印 calldata（供钱包直接粘贴）
    const iface = new ethers.Interface(RECEIVER_ABI);
    const calldata = iface.encodeFunctionData("withdraw");
    console.log("\n========== Calldata ==========");
    console.log("To:  ", RECEIVER_CONTRACT);
    console.log("Data:", calldata);
    console.log("==============================\n");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});