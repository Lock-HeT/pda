// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVenusVToken {
    function mint(uint256 mintAmount) external returns (uint256);

    function transfer(address recipient, uint256 amount)
    external
    returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemBehalf(address redeemer, uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
}