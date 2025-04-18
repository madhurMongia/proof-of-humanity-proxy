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
import "./interfaces/ICrossChainProofOfHumanity.sol";
/**
 * @title ProofOfHumanityCirclesProxy
 * @dev A proxy contract that bridges Proof of Humanity verification with Circles.
 * This contract allows Circles to verify human identity using the Proof of Humanity registry
 */
contract ProofOfHumanityCirclesProxy is IProofOfHumanityCirclesProxy {

    /// @dev Address with administrative privileges
    address public governor;

    /// @notice Reference to the Proof of Humanity registry contract
    IProofOfHumanity public proofOfHumanity;

    /// @notice Reference to the Core Members Group contract
    ICoreMembersGroup public coreMembersGroup;

    /// @notice Reference to the CrossChainProofOfHumanity contract
    ICrossChainProofOfHumanity public crossChainProofOfHumanity;

    /// @notice Mapping to store the Circles account for each humanity ID
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
    constructor(address _proofOfHumanity, address _coreMembersGroup, address _crossChainProofOfHumanity) {
        proofOfHumanity = IProofOfHumanity(_proofOfHumanity);
        coreMembersGroup = ICoreMembersGroup(_coreMembersGroup);
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_crossChainProofOfHumanity);
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
     * @dev Updates the address of the CrossChainProofOfHumanity contract
     * @param _crossChainProofOfHumanity New address for the CrossChainProofOfHumanity contract
     * Can only be called by the governor
     */
    function changeCrossChainProofOfHumanity(address _crossChainProofOfHumanity) external onlyGovernor {
        crossChainProofOfHumanity = ICrossChainProofOfHumanity(_crossChainProofOfHumanity);
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
        uint40 expirationTime;
        address owner;
        (,,,expirationTime,owner,) = proofOfHumanity.getHumanityInfo(humanityID);

        if(owner == address(0)){
            ICrossChainProofOfHumanity.CrossChainHumanity memory crossChainHumanity = crossChainProofOfHumanity.humanityData(humanityID);
            if(!crossChainHumanity.isHomeChain){
                expirationTime = crossChainHumanity.expirationTime;
                owner = crossChainHumanity.owner;
            }
        }

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
        uint40 expirationTime;
        address owner;
        (,,,expirationTime,owner,) = proofOfHumanity.getHumanityInfo(humanityID);

        if(owner == address(0)){
            ICrossChainProofOfHumanity.CrossChainHumanity memory crossChainHumanity = crossChainProofOfHumanity.humanityData(humanityID);
            if(!crossChainHumanity.isHomeChain){
                expirationTime = crossChainHumanity.expirationTime;
                owner = crossChainHumanity.owner;
            }
        }
        require(owner != address(0),"Humanity ID is not claimed");
        address account = humanityIDToCriclesAccount[humanityID];

        address[] memory accounts = new address[](1);
        accounts[0] = account;
        coreMembersGroup.trustBatchWithConditions(accounts, uint96(expirationTime));

        emit TrustRenewed(humanityID, account);
    }

  
    /**
     * @dev Untrusts/Removes revoked accounts from the Circles Group
     * @param humanityIDs humanity IDs of revoked accounts to untrust
     */
    function revokeTrust(bytes20[] memory humanityIDs) external {
        uint256 length = humanityIDs.length;
        bytes20 humanityID;
        address[] memory accounts = new address[](length);
        for(uint256 i = 0; i < length; i++){
            humanityID = humanityIDs[i];
            bool isHuman = crossChainProofOfHumanity.isClaimed(humanityID);
            require(!isHuman, "Account is still registered as human");
            accounts[i] = humanityIDToCriclesAccount[humanityID];
        }
        // setting the expiry timestamp to 0 means untrusting the account.
        coreMembersGroup.trustBatchWithConditions(accounts, 0);

        emit MembersRemoved(humanityIDs);
    }
}