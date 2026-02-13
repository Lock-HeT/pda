// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IERC20.sol";

contract PDARecruitmentNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 913;
    

    uint256 public constant TIER1_END = 200;
    uint256 public constant TIER2_END = 400;
    uint256 public constant TIER3_END = 600;
    uint256 public constant TIER4_END = 913;
    
    uint256 public constant PRICE_TIER1 = 500 * 10**18;
    uint256 public constant PRICE_TIER2 = 550 * 10**18;
    uint256 public constant PRICE_TIER3 = 600 * 10**18;
    uint256 public constant PRICE_TIER4 = 650 * 10**18;

    address public immutable USDT;
    
    uint256 public currentTokenId;
    bool public saleActive;
    address public treasuryA;
    address public treasuryB;
    uint256 public percentageA;
    
    string public constant BASE_URI = "https://peach-cheap-junglefowl-625.mypinata.cloud/ipfs/bafkreie3oxxveugfjibdwjl6sbcebemrgies5tfklz3tf733jroacbmfk4";
    
    mapping(address => uint256[]) public userTokens;

    mapping(address => bool) public hasMinted;
    
    event NFTMinted(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event FundsDistributed(address indexed addressA, uint256 amountA, address indexed addressB, uint256 amountB);
    event SaleStatusChanged(bool active);
    event TreasuryAChanged(address indexed newTreasuryA);
    event TreasuryBChanged(address indexed newTreasuryB);
    event PercentageAChanged(uint256 newPercentage);
    
    constructor(
        address _usdt,
        address _treasuryA,
        address _treasuryB
    ) ERC721("PDA Recruitment NFT", "PDANFT") Ownable(msg.sender) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_treasuryA != address(0), "Invalid treasury A");
        require(_treasuryB != address(0), "Invalid treasury B");
        
        USDT = _usdt;
        treasuryA = _treasuryA;
        treasuryB = _treasuryB;
        percentageA = 30;
        saleActive = false;
        currentTokenId = 0;
    }
    
    function getCurrentPrice() public view returns (uint256) {
        uint256 nextTokenId = currentTokenId + 1;
        
        if (nextTokenId <= TIER1_END) {
            return PRICE_TIER1;
        } else if (nextTokenId <= TIER2_END) {
            return PRICE_TIER2;
        } else if (nextTokenId <= TIER3_END) {
            return PRICE_TIER3;
        } else if (nextTokenId <= TIER4_END) {
            return PRICE_TIER4;
        } else {
            revert("Max supply reached");
        }
    }
    
    function mint() external nonReentrant {
        require(saleActive, "Sale is not active");
        require(currentTokenId < MAX_SUPPLY, "Max supply reached");
        require(!hasMinted[msg.sender], "Address has already minted");

        uint256 price = getCurrentPrice();
        uint256 tokenId = currentTokenId + 1;
        
        require(
            IERC20(USDT).transferFrom(msg.sender, address(this), price),
            "USDT payment failed"
        );

        _safeMint(msg.sender, tokenId);
        currentTokenId = tokenId;
        userTokens[msg.sender].push(tokenId);
        hasMinted[msg.sender] = true;
        
        emit NFTMinted(msg.sender, tokenId, price);
        
        uint256 amountA = (price * percentageA) / 100;
        uint256 amountB = price - amountA;
        
        require(IERC20(USDT).transfer(treasuryA, amountA), "Transfer to A failed");
        require(IERC20(USDT).transfer(treasuryB, amountB), "Transfer to B failed");
        
        emit FundsDistributed(treasuryA, amountA, treasuryB, amountB);
    }
    
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return userTokens[user];
    }
    
    function getUserTokenCount(address user) external view returns (uint256) {
        return userTokens[user].length;
    }
    
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - currentTokenId;
    }
    
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return BASE_URI;
    }
    

    function setSaleActive(bool _active) external onlyOwner {
        saleActive = _active;
        emit SaleStatusChanged(_active);
    }
    
    function setTreasuryA(address _treasuryA) external onlyOwner {
        require(_treasuryA != address(0), "Invalid treasury A");
        treasuryA = _treasuryA;
        emit TreasuryAChanged(_treasuryA);
    }
    
    function setTreasuryB(address _treasuryB) external onlyOwner {
        require(_treasuryB != address(0), "Invalid treasury B");
        treasuryB = _treasuryB;
        emit TreasuryBChanged(_treasuryB);
    }
    
    function setPercentageA(uint256 _percentage) external onlyOwner {
        require(_percentage <= 100, "Percentage must be <= 100");
        percentageA = _percentage;
        emit PercentageAChanged(_percentage);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
    
    
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0) && from != to) {
            uint256[] storage fromTokens = userTokens[from];
            for (uint256 i = 0; i < fromTokens.length; i++) {
                if (fromTokens[i] == tokenId) {
                    fromTokens[i] = fromTokens[fromTokens.length - 1];
                    fromTokens.pop();
                    break;
                }
            }
            
            userTokens[to].push(tokenId);
        }
        return from;
    }
}
