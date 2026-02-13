// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IPair.sol";
import "./interfaces/IRouter02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PDALiquidityManager is Ownable, ReentrancyGuard {
    address public immutable PDA;
    address public immutable LP_TOKEN;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;

    uint256 public immutable startTime;

    struct LPInfo {
        uint256 amount;
        uint256 depositTime;
        uint256 depositDay;
    }

    mapping(address => mapping(uint256 => LPInfo)) public userLPInfo;

    uint256 public totalLPLocked;
    uint256 public totalPDABurned;

    mapping(address => bool) public authorizedContracts;

    mapping(address => uint256) public contractSource;

    event LiquidityAdded(address indexed user, uint256 source, uint256 lpAmount, uint256 depositDay);
    event LiquidityRemoved(address indexed user, uint256 source, uint256 lpAmount, uint256 pdaReturned, uint256 pdaBurned, uint256 usdtReturned);
    event AuthorizedContractAdded(address indexed contractAddress, uint256 source);
    event AuthorizedContractRemoved(address indexed contractAddress);
    
    constructor(
        address _pda
    ) Ownable(msg.sender) {
        require(_pda != address(0), "Invalid PDA address");
        PDA = _pda;

        IRouter02 router = IRouter02(ROUTER);
        IFactory factory = IFactory(router.factory());
        LP_TOKEN = factory.createPair(address(this), USDT);
        startTime = block.timestamp;
    }
    

    function addLiquidityForUser(address user, uint256 usdtAmount) external nonReentrant returns (uint256) {
        require(authorizedContracts[msg.sender], "Not authorized contract");
        require(usdtAmount > 0, "Invalid amount");

        uint256 source = contractSource[msg.sender];

        require(
            IERC20(USDT).transferFrom(msg.sender, address(this), usdtAmount),
            "USDT transfer failed"
        );

        uint256 halfAmount = usdtAmount / 2;
        uint256 otherHalf = usdtAmount - halfAmount;

        IERC20(USDT).approve(ROUTER, usdtAmount);

        address[] memory path = new address[](2);
        path[0] = USDT;
        path[1] = PDA;
        
        uint256[] memory amounts = IRouter02(ROUTER).swapExactTokensForTokens(
            halfAmount,
            0,
            path,
            address(this),
            block.timestamp + 300
        );
        
        uint256 pdaAmount = amounts[1];

        IERC20(PDA).approve(ROUTER, pdaAmount);

        (, , uint256 liquidity) = IRouter02(ROUTER).addLiquidity(
            PDA,
            USDT,
            pdaAmount,
            otherHalf,
            0,
            0,
            address(this),
            block.timestamp + 300
        );

        uint256 currentDay = getCurrentDay();
        LPInfo storage info = userLPInfo[user][source];

        if (info.amount > 0) {
            info.amount += liquidity;
        } else {
            info.amount = liquidity;
            info.depositTime = block.timestamp;
            info.depositDay = currentDay;
        }
        
        totalLPLocked += liquidity;
        
        emit LiquidityAdded(user, source, liquidity, currentDay);
        
        return liquidity;
    }

    function removeLiquidity(uint256 source) external nonReentrant {
        require(source <= 1, "Invalid source");
        
        LPInfo storage info = userLPInfo[msg.sender][source];
        require(info.amount > 0, "No LP to remove");
        
        uint256 lpAmount = info.amount;
        uint256 depositDay = info.depositDay;

        IERC20(LP_TOKEN).approve(ROUTER, lpAmount);

        (uint256 pdaAmount, uint256 usdtAmount) = IRouter02(ROUTER).removeLiquidity(
            PDA,
            USDT,
            lpAmount,
            0,
            0,
            address(this),
            block.timestamp + 300
        );

        uint256 returnRate = calculateReturnRate(depositDay);

        uint256 returnedPDA = (pdaAmount * returnRate) / 10000;
        uint256 burnedPDA = pdaAmount - returnedPDA;

        if (returnedPDA > 0) {
            require(IERC20(PDA).transfer(msg.sender, returnedPDA), "PDA transfer failed");
        }

        if (burnedPDA > 0) {
            require(IERC20(PDA).transfer(DEAD_ADDRESS, burnedPDA), "PDA burn failed");
            totalPDABurned += burnedPDA;
        }

        require(IERC20(USDT).transfer(msg.sender, usdtAmount), "USDT transfer failed");

        totalLPLocked -= lpAmount;

        delete userLPInfo[msg.sender][source];
        
        emit LiquidityRemoved(msg.sender, source, lpAmount, returnedPDA, burnedPDA, usdtAmount);
    }

    function calculateReturnRate(uint256 depositDay) public pure returns (uint256) {
        uint256 rate = 100 + (depositDay * 50);

        if (rate > 5000) {
            rate = 5000;
        }
        
        return rate;
    }
    

    function getCurrentDay() public view returns (uint256) {
        return (block.timestamp - startTime) / 1 days;
    }

    function getUserLPInfo(address user, uint256 source) external view returns (
        uint256 amount,
        uint256 depositTime,
        uint256 depositDay,
        uint256 currentReturnRate,
        uint256 daysHeld
    ) {
        require(source <= 1, "Invalid source");
        
        LPInfo storage info = userLPInfo[user][source];
        amount = info.amount;
        depositTime = info.depositTime;
        depositDay = info.depositDay;
        currentReturnRate = calculateReturnRate(depositDay);
        daysHeld = info.depositTime > 0 ? (block.timestamp - info.depositTime) / 1 days : 0;
    }

    function getUserAllLPInfo(address user) external view returns (
        uint256 depositAmount,
        uint256 depositReturnRate,
        uint256 gameAmount,
        uint256 gameReturnRate
    ) {
        LPInfo storage depositInfo = userLPInfo[user][0];
        LPInfo storage gameInfo = userLPInfo[user][1];
        
        depositAmount = depositInfo.amount;
        depositReturnRate = depositInfo.amount > 0 ? calculateReturnRate(depositInfo.depositDay) : 0;
        
        gameAmount = gameInfo.amount;
        gameReturnRate = gameInfo.amount > 0 ? calculateReturnRate(gameInfo.depositDay) : 0;
    }

    function getContractStats() external view returns (
        uint256 _totalLPLocked,
        uint256 _totalPDABurned,
        uint256 _currentDay,
        uint256 _currentReturnRate
    ) {
        _totalLPLocked = totalLPLocked;
        _totalPDABurned = totalPDABurned;
        _currentDay = getCurrentDay();
        _currentReturnRate = calculateReturnRate(_currentDay);
    }

    function addAuthorizedContract(address contractAddress, uint256 source) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        require(source <= 1, "Invalid source");
        
        authorizedContracts[contractAddress] = true;
        contractSource[contractAddress] = source;
        
        emit AuthorizedContractAdded(contractAddress, source);
    }
    

    function removeAuthorizedContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit AuthorizedContractRemoved(contractAddress);
    }

    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(to, amount), "Transfer failed");
    }
}
