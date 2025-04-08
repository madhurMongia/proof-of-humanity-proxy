// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import {ICoreMembersGroup} from "./ICoreMembersGroup.sol";

/**
 * @title IProofOfHumanityCirclesProxy
 * @dev Interface for the ProofOfHumanityCirclesProxy contract.
 * Defines the functions that can be called by external contracts.
 */
interface IProofOfHumanityCirclesProxy {

    /**
     * @dev Updates the address of the Proof of Humanity registry
     * @param _proofOfHumanity New address for the Proof of Humanity registry
     */
    function changeProofOfHumanity(address _proofOfHumanity) external;

    /**
     * @dev Transfers governorship to a new address
     * @param _newGovernor Address of the new governor
     */
    function transferGovernorship(address _newGovernor) external;
    /**
     * @dev Adds a member to the Circles Group based on PoH verification
     * @param _account Address of the account to add
     */
    function addMember(address _account, ICoreMembersGroup _coreMembersGroup) external;

    /**
     * @dev Removes a member from the Circles Group
     * @param _accounts Addresses of the accounts to remove
     */
    function removeMembersBatch(address[] memory _accounts, ICoreMembersGroup _coreMembersGroup) external;
}