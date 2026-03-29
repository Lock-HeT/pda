import { ethers } from "hardhat";

async function main() {
  const tokenArgs = [
    "0xb680ad3b50143500a785388fa0a9dd084697ea5e",
    "0xc8DF60C860Cf7A440852cAf91f9a39bA3c362378",
    "0x1e0f55df4f48a6008ac848f7a3e2587ccdba2305",
    "0xb680ad3b50143500a785388fa0a9dd084697ea5e"
  ];
  const tokenType = ["address","address","address","address"];

  const abiCoder = new ethers.AbiCoder();
  const encoded = abiCoder.encode(
      tokenType,
      tokenArgs
  );

  console.log("Encoded constructor arguments:", encoded.slice(2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
