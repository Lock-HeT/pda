// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISwapperAddress {
    function notifyFeeReceived(uint256 amount, address payable feeAddress) external;
}
