// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

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
     * @dev Updates the address of the Core Members Group contract
     * @param _coreMembersGroup New address for the Core Members Group contract
     */
    function changeCoreMembersGroup(address _coreMembersGroup) external;

    /**
     * @dev Updates the address of the CrossChainProofOfHumanity contract
     * @param _crossChainProofOfHumanity New address for the CrossChainProofOfHumanity contract
     */
    function changeCrossChainProofOfHumanity(address _crossChainProofOfHumanity) external;

    /**
     * @dev Transfers governorship to a new address
     * @param _newGovernor Address of the new governor
     */
    function transferGovernorship(address _newGovernor) external;

    /**
     * @dev Trusts/Add an account in the Circles Group
     * @param humanityID The humanity ID of the account to trust
     * @param _account Address of the circles account to trust in POH group
     */
    function register(bytes20 humanityID, address _account) external;
    
    /**
     * @dev Re-trusts an account in the Circles Group, after renewing humanity in POH
     * @param humanityID The humanity ID of the account to re-trust
     */
    function renewTrust(bytes20 humanityID) external;
    
    /**
     * @dev Untrusts/Remove accounts from the Circles Group
     * @param humanityIDs humanity IDs of the expired or revoked accounts to untrust
     */
    function revokeTrust(bytes20[] memory humanityIDs) external;
}