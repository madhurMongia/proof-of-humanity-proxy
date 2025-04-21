// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ICrossChainProofOfHumanity
 * @dev interface for the CrossChainProofOfHumanity contract
 */
interface ICrossChainProofOfHumanity {

    struct CrossChainHumanity {
        address owner; // the owner address
        uint40 expirationTime; // expirationTime at the moment of update
        uint40 lastTransferTime; // time of the last received transfer
        bool isHomeChain; // whether current chain is considered as home chain by this contract
    }
  
    function humanityData(bytes20 humanityId) external view returns (CrossChainHumanity memory);

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Checks whether humanity is claimed or not
     * @param _humanityId The ID of the humanity to check
     * @return Whether humanity is claimed
     */
    function isClaimed(bytes20 _humanityId) external view returns (bool);

    /**
     * @dev Returns the owner address bound to a specific humanity ID.
     * @param _humanityId The ID of the humanity.
     * @return The owner address.
     */
    function boundTo(bytes20 _humanityId) external view returns (address);

    /**
     * @dev Checks if a humanity ID is registered as human.
     * @param _account The address of the account to check.
     * @return Whether the account is registered as human.
     */
    function isHuman(address _account) external view returns (bool);
}
