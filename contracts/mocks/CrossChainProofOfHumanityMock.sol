// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/ICrossChainProofOfHumanity.sol";

contract CrossChainProofOfHumanityMock is ICrossChainProofOfHumanity {
    mapping(bytes20 => CrossChainHumanity) private _humanityData;
    mapping(bytes20 => bool) private _isClaimed;
    mapping(address => bool) private _isHuman;
    mapping(bytes20 => address) private _boundTo;
    mapping(address => bytes20) private _humanityOf;

    function mockHumanityData(bytes20 _humanityId, CrossChainHumanity memory _data) external {
        _humanityData[_humanityId] = _data;
    }

    function mockIsClaimed(bytes20 _humanityId, bool _status) external {
        _isClaimed[_humanityId] = _status;
    }
    
    function humanityData(bytes20 _humanityId) external view override returns (CrossChainHumanity memory) {
        return _humanityData[_humanityId];
    }

    function isClaimed(bytes20 _humanityId) external view override returns (bool) {
        return _isClaimed[_humanityId];
    }
} 