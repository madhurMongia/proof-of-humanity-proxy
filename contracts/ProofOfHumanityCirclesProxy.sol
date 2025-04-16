// SPDX-License-Identifier: MIT
/**
 *  @authors: [madhurMongia]
 *  @reviewers: []
 *  @auditors: []
 *  @bounties: []
 *  @deployments: []
 */

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
    uint96 public constant UNTRUST_EXPIRY_TIMESTAMP = 0;

    /// @dev Address with administrative privileges
    address public governor;

    /// @notice Reference to the Proof of Humanity registry contract
    IProofOfHumanity public proofOfHumanity;

    /// @notice Reference to the Hub contract
   // IHubV2 public hub;

    /// @notice Reference to the Core Members Group contract
    ICoreMembersGroup public coreMembersGroup;

    mapping(bytes20 => address) public humanityIDToCriclesAccount;
    /**
     * @dev Restricts function access to the governor only
     * Provides administrative protection for sensitive operations
     */
    modifier onlyGovernor() {
        require(msg.sender == governor, "Only governor can call this function");
        _;
    }

    /**
     * @dev Emitted when a member is added to the Circles Group
     * @param member The address of the member added
     */
    event MemberRegistered(bytes20 indexed humanityID, address indexed member);

    /**
     * @dev Emitted when members are removed from the Circles Group
     * @param humanityIDs The humanity IDs of the members removed
     */
    event MembersRemoved(bytes20[] humanityIDs);

    /**
     * @dev Emitted when a member is added to the Circles Group
     * @param humanityID The humanity ID of the account to re-trust
     * @param oldAccount The old account that was replaced
     * @param newAccount The new account that replaced the old account
     */
    event TrustTransferred(bytes20 indexed humanityID, address indexed oldAccount, address indexed newAccount);

    /**
     * @dev Emitted when a member is renewed in the Circles Group
     * @param humanityID The humanity ID of the account to re-trust
     * @param account The account that was renewed
     */
    event TrustRenewed(bytes20 indexed humanityID, address indexed account);

    /**
     * @dev Initializes the proxy contract with required external contracts
     * @param _proofOfHumanity Address of the Proof of Humanity registry contract
     * @param _coreMembersGroup Address of the POH Core Members Group contract
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
     * @dev Updates the address of the Core Members Group contract
     * @param _coreMembersGroup New address for the POH Core Members Group contract
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
     * @dev Trusts/Add an account in the Circles Group
     * @param humanityID The humanity ID of the account to trust
     * @param _account Address of the circles account to trust in POH group
     */
    function register(bytes20 humanityID, address _account) external {
        (,,,uint40 expirationTime,address owner,) = proofOfHumanity.getHumanityInfo(humanityID);

        require(owner == msg.sender, "You are not the owner of this humanity ID");
        require(humanityIDToCriclesAccount[humanityID] == address(0), "Account is already registered");

        humanityIDToCriclesAccount[humanityID] = _account;
          // trust will expire at the same time as the humanity.
        address[] memory accounts = new address[](1);
        accounts[0] = _account;
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));

        emit MemberRegistered(humanityID, _account);
    }
    
    /**
     * @dev Re-trusts an account in the Circles Group, after renewing humanity in POH
     * @param humanityID The humanity ID of the account to re-trust
     */
    function renewTrust(bytes20 humanityID) external {
        (,,,uint40 expirationTime,,) = proofOfHumanity.getHumanityInfo(humanityID);
        address account = humanityIDToCriclesAccount[humanityID];

        address[] memory accounts = new address[](1);
        accounts[0] = account;
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));

        emit TrustRenewed(humanityID, account);
    }

  
    /**
     * @dev Untrusts/Removes expired or revoked accounts from the Circles Group
     * @param humanityIDs humanity IDs of the expired or revoked accounts to untrust
     */
    function revokeTrust(bytes20[] memory humanityIDs) external {
        uint256 length = humanityIDs.length;
        bytes20 humanityID;
        address[] memory accounts = new address[](length);
        for(uint256 i = 0; i < length; i++){
            humanityID = humanityIDs[i];
            bool isHuman = proofOfHumanity.isClaimed(humanityID);
            require(!isHuman, "Account is still registered as human");
            accounts[i] = humanityIDToCriclesAccount[humanityID];
        }
        coreMembersGroup.trustBatchWithConditions(accounts, UNTRUST_EXPIRY_TIMESTAMP);

        emit MembersRemoved(humanityIDs);
    }
}