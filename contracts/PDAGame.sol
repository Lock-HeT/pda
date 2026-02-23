// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IPDAReferral.sol";
import "./interfaces/IPDALiquidityManager.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract PDAGame is 
    Initializable, 
    OwnableUpgradeable, 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    IPDAReferral public referralContract;

    IPDALiquidityManager public liquidityManager;

    address public operationAddress;
    address public dappAddress;
    address public gameOperator;
    // TODO
    /*uint256 public constant GAME_TYPE_100 = 100 * 10**18;
    uint256 public constant GAME_TYPE_200 = 200 * 10**18;
    uint256 public constant GAME_TYPE_300 = 300 * 10**18;*/
    uint256 public constant GAME_TYPE_100 = 10**15;
    uint256 public constant GAME_TYPE_200 = 2 * 10**15;
    uint256 public constant GAME_TYPE_300 = 3 * 10**15;

    uint256 public constant PLAYERS_PER_GAME = 11;
    /*uint256 public constant GAME_TIMEOUT = 24 hours;*/
    uint256 public constant GAME_TIMEOUT = 30 minutes; //TODO

    struct Game {
        uint256 gameId;
        uint256 betAmount;
        address[] players;
        uint256 startTime;
        uint256 endTime;
        bool finished;
        bool refunded;
        address winner;
    }

    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(uint256 => Game)) public gamesByType;
    mapping(uint256 => uint256) public currentGameIndex;

    mapping(address => uint256[]) public userGames;

    uint256[3] public gameTypes;

    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;

    event GameCreated(uint256 indexed gameId, uint256 betAmount);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 playerIndex);
    event GameFinished(uint256 indexed gameId, address indexed winner);
    event GameRefunded(uint256 indexed gameId);
    event PrizePaid(uint256 indexed gameId, address indexed recipient, uint256 amount, string reason);
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

        gameTypes[0] = GAME_TYPE_100;
        gameTypes[1] = GAME_TYPE_200;
        gameTypes[2] = GAME_TYPE_300;
        
        emit Initialized(_msgSender(), _referralContract, _liquidityManager);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function joinGame(uint256 betAmount, address referrer) external nonReentrant {
        require(
            betAmount == GAME_TYPE_100 || betAmount == GAME_TYPE_200 || betAmount == GAME_TYPE_300,
            "Invalid bet amount"
        );

        if (!referralContract.hasReferrer(msg.sender)) {
            require(referrer != address(0), "Must provide referrer");
            referralContract.bindReferrerByContract(msg.sender, referrer);
        }
        
        require(
            IERC20(USDT).transferFrom(msg.sender, address(this), betAmount),
            "USDT transfer failed"
        );
        
        uint256 currentIndex = currentGameIndex[betAmount];
        Game storage game = gamesByType[betAmount][currentIndex];
        
        if (game.players.length == 0) {
            gameIdCounter++;
            game.gameId = gameIdCounter;
            game.betAmount = betAmount;
            game.startTime = block.timestamp;
            game.finished = false;
            game.refunded = false;
            
            games[gameIdCounter] = game;
            emit GameCreated(gameIdCounter, betAmount);
        } else if (game.players.length >= PLAYERS_PER_GAME) {
            require(game.finished || game.refunded, "Current game not finished yet");
            
            currentGameIndex[betAmount]++;
            currentIndex = currentGameIndex[betAmount];
            
            gameIdCounter++;
            Game storage newGame = gamesByType[betAmount][currentIndex];
            newGame.gameId = gameIdCounter;
            newGame.betAmount = betAmount;
            newGame.startTime = block.timestamp;
            newGame.finished = false;
            newGame.refunded = false;
            
            games[gameIdCounter] = newGame;
            game = newGame;
            emit GameCreated(gameIdCounter, betAmount);
        }
        
        referralContract.activateUser(msg.sender);
        
        game.players.push(msg.sender);
        userGames[msg.sender].push(game.gameId);
        
        emit PlayerJoined(game.gameId, msg.sender, game.players.length - 1);
        
        if (game.players.length == PLAYERS_PER_GAME) {
            game.endTime = block.timestamp;
        }
    }

    function declareWinner(uint256 gameId, address winner) external nonReentrant {
        require(msg.sender == gameOperator, "Only game operator can declare winner");
        Game storage game = games[gameId];
        require(game.gameId == gameId, "Game not found");
        require(!game.finished, "Game already finished");
        require(!game.refunded, "Game already refunded");
        require(game.players.length == PLAYERS_PER_GAME, "Game not full");
        
        bool isPlayer = false;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == winner) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Winner must be a player");
        
        game.finished = true;
        game.winner = winner;
        game.endTime = block.timestamp;
        
        _distributePrize(gameId, winner);
        
        emit GameFinished(gameId, winner);
    }

    function _distributePrize(uint256 gameId, address winner) internal {
        Game storage game = games[gameId];
        uint256 totalPrize = game.betAmount * PLAYERS_PER_GAME;

        uint256 nonWinnerShare = (totalPrize * 2) / 100;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] != winner) {
                require(IERC20(USDT).transfer(game.players[i], nonWinnerShare), "Non-winner transfer failed");
                emit PrizePaid(gameId, game.players[i], nonWinnerShare, "Non-winner share");
            }
        }

        _distributeCommission(gameId, winner, totalPrize);

        uint256 operationAmount = (totalPrize * 2) / 100;
        require(IERC20(USDT).transfer(operationAddress, operationAmount), "Operation transfer failed");
        emit PrizePaid(gameId, operationAddress, operationAmount, "Operation");

        uint256 dappAmount = (totalPrize * 10) / 100;
        require(IERC20(USDT).transfer(dappAddress, dappAmount), "Dapp transfer failed");
        emit PrizePaid(gameId, dappAddress, dappAmount, "Dapp");

        uint256 liquidityAmount = (totalPrize * 60) / 100;
        _addLiquidity(winner, liquidityAmount);
    }

    function _distributeCommission(uint256 gameId, address winner, uint256 totalPrize) internal returns (uint256) {
        uint256 totalCommission = 0;
        address current = referralContract.referrer(winner);
        
        if (current == address(0)) {
            return 0;
        }
        
        uint256 activeLevel = 0;
        
        for (uint256 i = 0; i < 30 && current != address(0); i++) {
            if (referralContract.isActiveUser(current)) {
                activeLevel++;
                
                uint256 currentMaxLevel = referralContract.getMaxLevel(current);

                if (activeLevel <= currentMaxLevel) {
                    uint256 commission = 0;
                    
                    if (activeLevel == 1) {
                        commission = (totalPrize * 2) / 100;
                    } else if (activeLevel == 2) {
                        commission = (totalPrize * 1) / 100;
                    } else if (activeLevel >= 3 && activeLevel <= 10) {
                        commission = (totalPrize * 3) / 1000;
                    } else if (activeLevel >= 11 && activeLevel <= 30) {
                        commission = (totalPrize * 13) / 10000;
                    }
                    
                    if (commission > 0) {
                        require(IERC20(USDT).transfer(current, commission), "Commission transfer failed");
                        totalCommission += commission;
                        emit PrizePaid(gameId, current, commission, "Upline commission");
                    }
                }
            }
            
            current = referralContract.referrer(current);
        }
        
        return totalCommission;
    }

    function _addLiquidity(address user, uint256 amount) internal {
        IERC20(USDT).approve(address(liquidityManager), amount);
        liquidityManager.addLiquidityForUser(user, amount);
    }

    function refundGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.gameId == gameId, "Game not found");
        require(!game.finished, "Game already finished");
        require(!game.refunded, "Game already refunded");
        require(game.players.length < PLAYERS_PER_GAME, "Game is full");
        require(block.timestamp >= game.startTime + GAME_TIMEOUT, "Game not timed out yet");
        
        game.refunded = true;
        
        for (uint256 i = 0; i < game.players.length; i++) {
            require(
                IERC20(USDT).transfer(game.players[i], game.betAmount),
                "Refund transfer failed"
            );
        }
        
        emit GameRefunded(gameId);
    }
    

    function getGame(uint256 gameId) external view returns (
        uint256 id,
        uint256 betAmount,
        address[] memory players,
        uint256 startTime,
        uint256 endTime,
        bool finished,
        bool refunded,
        address winner
    ) {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.betAmount,
            game.players,
            game.startTime,
            game.endTime,
            game.finished,
            game.refunded,
            game.winner
        );
    }

    function getCurrentGame(uint256 betAmount) external view returns (
        uint256 gameId,
        uint256 playerCount,
        uint256 startTime,
        bool canJoin
    ) {
        uint256 currentIndex = currentGameIndex[betAmount];
        Game storage game = gamesByType[betAmount][currentIndex];
        
        bool _canJoin = game.players.length < PLAYERS_PER_GAME && 
                       !game.finished && 
                       !game.refunded;
        
        return (
            game.gameId,
            game.players.length,
            game.startTime,
            _canJoin
        );
    }
    

    function getUserGames(address user) external view returns (uint256[] memory) {
        return userGames[user];
    }
    

    function setOperationAddress(address _operationAddress) external onlyOwner {
        require(_operationAddress != address(0), "Invalid operation address");
        operationAddress = _operationAddress;
    }
    

    function setDappAddress(address _dappAddress) external onlyOwner {
        require(_dappAddress != address(0), "Invalid dapp address");
        dappAddress = _dappAddress;
    }

    function setGameOperator(address _gameOperator) external onlyOwner {
        require(_gameOperator != address(0), "Invalid game operator address");
        gameOperator = _gameOperator;
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }

}
