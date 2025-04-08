// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICoreMembersGroup
 * @dev Interface for the Circles Core Members Group contract.
 */
interface ICoreMembersGroup {
    /**
     * @dev Adds trust connections for a batch of users with specified conditions
     * @param _coreMembers Array of users to trust
     * @param _expiry Expiration timestamp for the trust (0 to untrust)
     */
    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external;
}