// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;

import "./interfaces/IProofOfHumanity.sol";
import "./interfaces/ICoreMembersGroup.sol";
import "./interfaces/IProofOfHumanityCirclesProxy.sol";

/**
 * @title ProofOfHumanityCirclesProxy
 * @dev A proxy contract that bridges Proof of Humanity verification with Circles.
 * This contract allows Circles to verify human identity using the Proof of Humanity registry
 */
contract ProofOfHumanityCirclesProxy is IProofOfHumanityCirclesProxy {

    /// @notice Constant value for untrusting a member (setting expiry to 0)
    uint96 private constant UNTRUST_EXPIRY = 0;

    /// @dev Address with administrative privileges
    address public governor;

    /// @notice Reference to the Proof of Humanity registry contract
    IProofOfHumanity public proofOfHumanity;
    
    /// @notice Reference to the Circles Core Members Group contract
    ICoreMembersGroup public coreMembersGroup;

    /**
     * @dev Restricts function access to the governor only
     * Provides administrative protection for sensitive operations
     */
    modifier onlyGovernor() {
        require(msg.sender == governor);
        _;
    }

    /**
     * @dev Initializes the proxy contract with required external contracts
     * @param _proofOfHumanity Address of the Proof of Humanity registry contract
     * @param _coreMembersGroup Address of the Circles Core Members Group contract
     */
    constructor(address _proofOfHumanity, address _coreMembersGroup) {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
        governor = msg.sender; // Set deployer as initial governor
    }

    /**
     * @dev Updates the address of the Proof of Humanity registry
     * @param _proofOfHumanity New address for the Proof of Humanity registry
     * Can only be called by the governor
     */
    function changeProofOfHumanity(address _proofOfHumanity) external onlyGovernor {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
    }

    /**
     * @dev Updates the address of the Circles Group
     * @param _coreMembersGroup New address for the Circles Group
     * Can only be called by the governor
     */
    function changeCoreMembersGroup(address _coreMembersGroup) external onlyGovernor {
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
    }

    /**
     * @dev Transfers governorship to a new address
     * @param _newGovernor Address of the new governor
     * Can only be called by the current governor
     */
    function transferGovernorship(address _newGovernor) external onlyGovernor {
        governor = _newGovernor;
    }

    /**
     * @dev Trusts/Add an accounts in the Circles Group
     * @param _account Address of the account to trust
     */
    function addMember(address _account) external {

        require(proofOfHumanity.isHuman(_account));

        (,,,uint40 expirationTime,,) = proofOfHumanity.getHumanityInfo(proofOfHumanity.humanityOf(_account));
        /// trust will expire at the same time as the humanity
        address[] memory accounts = new address[](1);
        accounts[0] = _account;
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));
    }

    /**
     * @dev Untrusts/Remove an account from the Circles Group
     * @param _accounts Addresses of the accounts to untrust
     */
    function removeMembersBatch(address[] memory _accounts) external {

        uint256 length = _accounts.length;

        address[] memory accounts = new address[](length);
        for(uint256 i = 0; i < length; i++){
            require(proofOfHumanity.isHuman(_accounts[i]));
        }
        coreMembersGroup.trustBatchWithConditions(accounts, UNTRUST_EXPIRY);
    }
}