// SPDX-License-Identifier: MIT
pragma solidity >=0.8.28;


interface IProofOfHumanity {

    /* Views */

    function isHuman(address _address) external view returns (bool);
    
    function isClaimed(bytes20 _humanityId) external view returns (bool);

    function humanityOf(address _account) external view returns (bytes20 humanityId);

    function getHumanityInfo(
        bytes20 _humanityId
    )
        external
        view
        returns (
            bool vouching,
            bool pendingRevocation,
            uint48 nbPendingRequests,
            uint40 expirationTime,
            address owner,
            uint256 nbRequests
        );

    function getHumanityCount() external view returns (uint256);
}
