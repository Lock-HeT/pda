// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPDALiquidityManager {
    function addLiquidityForUser(address user, uint256 usdtAmount) external returns (uint256);
}
