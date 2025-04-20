// Sources flattened with hardhat v2.23.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/interfaces/ICoreMembersGroup.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity >=0.8.28;

/**
 * @title ICoreMembersGroup
 * @dev Interface for the Circles Core Members Group contract.
 */
interface ICoreMembersGroup {
    function trustBatchWithConditions(address[] memory _coreMembers, uint96 _expiry) external;
}


// File contracts/mocks/CoreMembersGroupMock.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.28;

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
