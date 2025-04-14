// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/IProofOfHumanity.sol";

contract ProofOfHumanityMock is IProofOfHumanity {
    mapping(address => bool) private _isHuman;
    mapping(bytes20 => bool) private _isClaimed;
    mapping(address => bytes20) private _humanityOf;
    mapping(bytes20 => HumanityInfo) private _humanityInfo;

    struct HumanityInfo {
        bool vouching;
        bool pendingRevocation;
        uint48 nbPendingRequests;
        uint40 expirationTime;
        address owner;
        uint256 nbRequests;
    }

    function mockIsHuman(address _address, bool _status) external {
        _isHuman[_address] = _status;
    }

    function mockIsClaimed(bytes20 _humanityId, bool _status) external {
        _isClaimed[_humanityId] = _status;
    }

    function mockHumanityOf(address _account, bytes20 _humanityId) external {
        _humanityOf[_account] = _humanityId;
    }

    function mockGetHumanityInfo(
        bytes20 _humanityId,
        HumanityInfo memory _info
    ) external {
        _humanityInfo[_humanityId] = _info;
    }

    function isHuman(address _address) external view override returns (bool) {
        return _isHuman[_address];
    }

    function isClaimed(bytes20 _humanityId) external view override returns (bool) {
        return _isClaimed[_humanityId];
    }

    function humanityOf(address _account) external view override returns (bytes20 humanityId) {
        return _humanityOf[_account];
    }

    function getHumanityInfo(
        bytes20 _humanityId
    )
        external
        view
        override
        returns (
            bool vouching,
            bool pendingRevocation,
            uint48 nbPendingRequests,
            uint40 expirationTime,
            address owner,
            uint256 nbRequests
        )
    {
        HumanityInfo memory info = _humanityInfo[_humanityId];
        return (
            info.vouching,
            info.pendingRevocation,
            info.nbPendingRequests,
            info.expirationTime,
            info.owner,
            info.nbRequests
        );
    }

    function getHumanityCount() external view override returns (uint256) {
        return 0; // Not used in tests
    }
} 