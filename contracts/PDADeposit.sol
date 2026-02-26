// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IPDAReferral.sol";
import "./interfaces/IPDALiquidityManager.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title PDADeposit
 * @dev 可升级的入金合约（UUPS代理模式），支持10-1000U入金，使用统一的推荐关系合约，通过流动性管理合约添加流动性
 */
contract PDADeposit is 
    Initializable, 
    OwnableUpgradeable, 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable 
{

    IPDAReferral public referralContract;

    IPDALiquidityManager public liquidityManager;

    address public operationAddress;
    address public dappAddress;

    // TODO
   /* uint256 public constant MIN_DEPOSIT = 100 * 10**18;
    uint256 public constant MAX_DEPOSIT = 1000 * 10**18;*/
    uint256 public constant MIN_DEPOSIT = 10**15;
    uint256 public constant MAX_DEPOSIT = 10**16;

    mapping(address => uint256) public totalDeposited;
    mapping(address => uint256) public depositCount;

    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    

    event Deposited(address indexed user, uint256 amount, address indexed referrer);
    event CommissionPaid(address indexed user, uint256 amount, uint8 level);
    event LiquidityAdded(address indexed user, uint256 usdtAmount, uint256 lpAmount);
    event Initialized(address indexed owner, address referral, address liquidityMgr);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _referralContract,
        address _liquidityManager,
        address _operationAddress,
        address _dappAddress
    ) external initializer {
        require(_referralContract != address(0), "Invalid referral contract");
        require(_liquidityManager != address(0), "Invalid liquidity manager");
        require(_operationAddress != address(0), "Invalid operation address");
        require(_dappAddress != address(0), "Invalid dapp address");
        
        __Ownable_init(_msgSender());
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        referralContract = IPDAReferral(_referralContract);
        liquidityManager = IPDALiquidityManager(_liquidityManager);
        operationAddress = _operationAddress;
        dappAddress = _dappAddress;
        
        emit Initialized(_msgSender(), _referralContract, _liquidityManager);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function deposit(uint256 amount, address referrer) external nonReentrant {
        require(amount >= MIN_DEPOSIT && amount <= MAX_DEPOSIT, "Invalid deposit amount");

        if (!referralContract.hasReferrer(msg.sender)) {
            require(referrer != address(0), "Must provide referrer");
            referralContract.bindReferrerByContract(msg.sender, referrer);
        }

        require(
            IERC20(USDT).transferFrom(msg.sender, address(this), amount),
            "USDT transfer failed"
        );

        referralContract.activateUser(msg.sender);

        totalDeposited[msg.sender] += amount;
        depositCount[msg.sender]++;

        _distributeDeposit(msg.sender, amount);
        
        emit Deposited(msg.sender, amount, referralContract.referrer(msg.sender));
    }

    function _distributeDeposit(address user, uint256 amount) internal {
        uint256 remaining = amount;

        uint256 commissionAmount = _distributeCommission(user, amount);
        remaining -= commissionAmount;

        uint256 operationAmount = (amount * 5) / 100;
        require(IERC20(USDT).transfer(operationAddress, operationAmount), "Operation transfer failed");
        remaining -= operationAmount;

        uint256 dappAmount = (amount * 10) / 100;
        require(IERC20(USDT).transfer(dappAddress, dappAmount), "Dapp transfer failed");
        remaining -= dappAmount;

        uint256 liquidityAmount = remaining;
        _addLiquidity(user, liquidityAmount);
    }

    function _distributeCommission(address user, uint256 amount) internal returns (uint256) {
        uint256 totalCommission = 0;
        address current = referralContract.referrer(user);
        
        if (current == address(0)) {
            return 0;
        }
        

        for (uint256 i = 1; i <= 30 && current != address(0); i++) {
            if (referralContract.isActiveUser(current)) {
                uint256 currentMaxLevel = referralContract.getMaxLevel(current);

                if (i <= currentMaxLevel) {
                    uint256 commission = 0;
                    
                    if (i == 1) {
                        commission = (amount * 4) / 100;
                    } else if (i == 2) {
                        commission = (amount * 2) / 100;
                    } else if (i >= 3 && i <= 10) {
                        commission = (amount * 1) / 100;
                    } else if (i >= 11 && i <= 20) {
                        commission = (amount * 6) / 1000;
                    } else if (i >= 21 && i <= 30) {
                        commission = (amount * 5) / 1000;
                    }
                    
                    if (commission > 0) {
                        require(IERC20(USDT).transfer(current, commission), "Commission transfer failed");
                        totalCommission += commission;
                        emit CommissionPaid(current, commission, uint8(i));
                    }
                }
            }
            
            current = referralContract.referrer(current);
        }
        
        return totalCommission;
    }

    function _addLiquidity(address user, uint256 amount) internal {
        IERC20(USDT).approve(address(liquidityManager), amount);
        uint256 lpAmount = liquidityManager.addLiquidityForUser(user, amount);
        emit LiquidityAdded(user, amount, lpAmount);
    }

    function getReferrer(address user) external view returns (address) {
        return referralContract.referrer(user);
    }

    function getReferrals(address user) external view returns (address[] memory) {
        return referralContract.getReferrals(user);
    }

    function getMaxLevel(address user) external view returns (uint256) {
        return referralContract.getMaxLevel(user);
    }

    function setOperationAddress(address _operationAddress) external onlyOwner {
        require(_operationAddress != address(0), "Invalid operation address");
        operationAddress = _operationAddress;
    }

    function setDappAddress(address _dappAddress) external onlyOwner {
        require(_dappAddress != address(0), "Invalid dapp address");
        dappAddress = _dappAddress;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }

}
