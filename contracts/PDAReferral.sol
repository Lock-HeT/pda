// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PDAReferral is Ownable {
    mapping(address => address) public referrer;
    mapping(address => address[]) public referrals;
    mapping(address => uint256) public referralCount;

    mapping(address => bool) public isActiveUser;
    mapping(address => uint256) public activeReferralCount;

    mapping(address => bool) public authorizedContracts;

    event ReferrerBound(address indexed user, address indexed referrer, address indexed binder);
    event UserActivated(address indexed user);
    event AuthorizedContractAdded(address indexed contractAddress);
    event AuthorizedContractRemoved(address indexed contractAddress);
    
    constructor() Ownable(msg.sender) {}

    function batchBindReferrer(address[] calldata users, address[] calldata referrers) external {
        require(users.length == referrers.length, "Array length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (referrer[users[i]] == address(0) && users[i] != referrers[i] && referrers[i] != address(0)) {
                _bindReferrer(users[i], referrers[i], msg.sender);
            }
        }
    }
    

    function _bindReferrer(address user, address _referrer, address binder) internal {
        require(referrer[user] == address(0), "Already bound");
        require(_referrer != address(0), "Invalid referrer");
        require(_referrer != user, "Cannot refer yourself");
        require(referrer[_referrer] != user, "Circular reference");

        address current = _referrer;
        for (uint256 i = 0; i < 30 && current != address(0); i++) {
            require(current != user, "Circular reference detected");
            current = referrer[current];
        }
        
        referrer[user] = _referrer;
        referrals[_referrer].push(user);
        referralCount[_referrer]++;
        
        emit ReferrerBound(user, _referrer, binder);
    }

    function bindReferrerByContract(address user, address _referrer) external {
        require(authorizedContracts[msg.sender], "Not authorized contract");
        _bindReferrer(user, _referrer, msg.sender);
    }
    

    function activateUser(address user) external {
        require(authorizedContracts[msg.sender], "Not authorized contract");
        
        if (!isActiveUser[user]) {
            isActiveUser[user] = true;
            emit UserActivated(user);

            address currentReferrer = referrer[user];
            if (currentReferrer != address(0)) {
                activeReferralCount[currentReferrer]++;
            }
        }
    }
    

    function getMaxLevel(address user) external view returns (uint256) {
        if (!isActiveUser[user]) {
            return 0;
        }
        
        uint256 count = activeReferralCount[user];
        
        if (count == 0) {
            return 0;
        } else if (count == 1) {
            return 2;
        } else if (count >= 15) {
            return 30;
        } else {
            return 2 + (count - 1) * 2;
        }
    }

    function getReferrals(address user) external view returns (address[] memory) {
        return referrals[user];
    }
    

    function getReferrerChain(address user, uint256 levels) external view returns (address[] memory) {
        address[] memory chain = new address[](levels);
        address current = referrer[user];
        
        for (uint256 i = 0; i < levels && current != address(0); i++) {
            chain[i] = current;
            current = referrer[current];
        }
        
        return chain;
    }


    function hasReferrer(address user) external view returns (bool) {
        return referrer[user] != address(0);
    }
    

    function addAuthorizedContract(address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = true;
        emit AuthorizedContractAdded(contractAddress);
    }
    

    function removeAuthorizedContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
        emit AuthorizedContractRemoved(contractAddress);
    }
    

    function isAuthorizedContract(address contractAddress) external view returns (bool) {
        return authorizedContracts[contractAddress];
    }
}
