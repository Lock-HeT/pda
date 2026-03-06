// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IVenusVToken.sol";
import "./interfaces/IRouter02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Receiver is Ownable {

    address public withdrawer;
    address public recipient;

    IERC20 public usdt = IERC20(0x55d398326f99059fF775485246999027B3197955);
    IERC20 public usdc = IERC20(0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d);
    IVenusVToken public vusdt = IVenusVToken(0xfD5840Cd36d94D7229439859C0112a4185BC0255);
    IRouter02 public router = IRouter02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

    constructor(address _withdrawer, address _recipient) Ownable(msg.sender) {
        require(_withdrawer != address(0), "Invalid withdrawer address");
        require(_recipient != address(0), "Invalid recipient address");
        withdrawer = _withdrawer;
        recipient = _recipient;
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == withdrawer, "Only withdrawer can call this function");
        require(usdt.balanceOf(address(this)) >= amount, "Insufficient USDT balance");

        require(usdt.approve(address(vusdt), amount), "Approve failed");
        require(vusdt.mint(amount) == 0, "Mint failed");

        uint256 vUsdtBalance = vusdt.balanceOf(address(this));

        uint256 usdtBalanceBefore = usdt.balanceOf(address(this));

        vusdt.redeem(vUsdtBalance);

        uint256 usdtBalanceAfter = usdt.balanceOf(address(this));
        uint256 actualRedeemed = usdtBalanceAfter - usdtBalanceBefore;
        require(actualRedeemed > 0, "No USDT redeemed");

        require(usdt.approve(address(router), actualRedeemed), "Router approve failed");
        
        address[] memory path = new address[](2);
        path[0] = address(usdt);
        path[1] = address(usdc);
        
        router.swapExactTokensForTokens(
            actualRedeemed,
            0,
            path,
            recipient,
            block.timestamp + 300
        );
    }

    function setWithdrawer(address newWithdrawer) external onlyOwner {
        require(newWithdrawer != address(0), "Invalid withdrawer address");
        withdrawer = newWithdrawer;
    }

    function setRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient address");
        recipient = newRecipient;
    }


    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }

}
