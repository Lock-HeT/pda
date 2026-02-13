// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPDAReferral {
    function referrer(address user) external view returns (address);
    function referralCount(address user) external view returns (uint256);
    function activeReferralCount(address user) external view returns (uint256);
    function isActiveUser(address user) external view returns (bool);
    function getMaxLevel(address user) external view returns (uint256);
    function hasReferrer(address user) external view returns (bool);
    function getReferrals(address user) external view returns (address[] memory);
    function getReferrerChain(address user, uint256 levels) external view returns (address[] memory);
    function bindReferrerByContract(address user, address _referrer) external;
    function activateUser(address user) external;
}
