// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICoreMembersGroup
 * @dev Interface for the Circles Core Members Group contract.
 */
interface ICoreMembersGroup {
    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external;
}