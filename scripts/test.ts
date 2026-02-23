import { ethers } from "hardhat";


async function main() {
    const roleHash = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    console.log(roleHash);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
