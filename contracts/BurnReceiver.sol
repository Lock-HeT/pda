// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BurnReceiver is Ownable {

    address public withdrawer;

    address public pda;
    constructor(address _withdrawer) Ownable(msg.sender) {
        require(_withdrawer != address(0), "Invalid withdrawer address");
        withdrawer = _withdrawer;
    }

    function withdraw() external {
        require(msg.sender == withdrawer, "Only withdrawer can call this function");
        uint256 amount = IERC20(pda).balanceOf(address(this));
        require(IERC20(pda).transfer(withdrawer, amount), "Transfer failed");

    }

    function setWithdrawer(address newWithdrawer) external onlyOwner {
        require(newWithdrawer != address(0), "Invalid withdrawer address");
        withdrawer = newWithdrawer;
    }

    function setPDA(address _pda) external onlyOwner {
        require(_pda != address(0), "Invalid PDA address");
        pda = _pda;
    }


    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }

}
