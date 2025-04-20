// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../../contracts/interfaces/ICoreMembersGroup.sol";

contract CoreMembersGroupMock is ICoreMembersGroup {
    bool public trustBatchWasCalled;
    // Keep public vars for potential direct access if needed elsewhere
    address[] public lastTrustedMembers;
    uint96 public lastTrustExpiry;

    // Add specific private variables and getters for testing
    address[] private _lastCalledMembers;
    uint96 private _lastCalledExpiry;

    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external override {
        trustBatchWasCalled = true;
        lastTrustedMembers = _coreMembers; // Keep updating public var
        lastTrustExpiry = _expiry;      // Keep updating public var
        _lastCalledMembers = _coreMembers; // Store args separately for testing
        _lastCalledExpiry = _expiry;     // Store args separately for testing
    }

    function reset() external {
        trustBatchWasCalled = false;
        delete lastTrustedMembers;
        lastTrustExpiry = 0;
        // Reset testing vars as well
        delete _lastCalledMembers;
        _lastCalledExpiry = 0;
    }

    // Explicit getters for test verification
    function getLastCalledMembers() external view returns (address[] memory) {
        return _lastCalledMembers;
    }

    function getLastCalledExpiry() external view returns (uint96) {
        return _lastCalledExpiry;
    }
} 