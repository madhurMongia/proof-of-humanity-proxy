// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/ICoreMembersGroup.sol";

contract CoreMembersGroupMock is ICoreMembersGroup {
    bool public trustBatchWasCalled;
    address[] public lastTrustedMembers;
    uint96 public lastTrustExpiry;

    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external override {
        trustBatchWasCalled = true;
        lastTrustedMembers = _coreMembers;
        lastTrustExpiry = _expiry;
    }

    function reset() external {
        trustBatchWasCalled = false;
        delete lastTrustedMembers;
        lastTrustExpiry = 0;
    }
} 