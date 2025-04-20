import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { ProofOfHumanityCirclesProxy, ProofOfHumanityMock, CoreMembersGroupMock, CrossChainProofOfHumanityMock } from "../typechain-types";
describe("ProofOfHumanityCirclesProxy", function () {
  let proofOfHumanityCirclesProxy: ProofOfHumanityCirclesProxy;
  let proofOfHumanityMock: ProofOfHumanityMock;
  let coreMembersGroupMock: CoreMembersGroupMock;
  let crossChainProofOfHumanityMock: CrossChainProofOfHumanityMock;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let humanityID: string;
  let expirationTime: number;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const ProofOfHumanityMockFactory = await ethers.getContractFactory("ProofOfHumanityMock");
    proofOfHumanityMock = await ProofOfHumanityMockFactory.deploy();

    const CoreMembersGroupMockFactory = await ethers.getContractFactory("CoreMembersGroupMock");
    coreMembersGroupMock = await CoreMembersGroupMockFactory.deploy();

    const CrossChainProofOfHumanityMockFactory = await ethers.getContractFactory("CrossChainProofOfHumanityMock");
    crossChainProofOfHumanityMock = await CrossChainProofOfHumanityMockFactory.deploy();

    const ProofOfHumanityCirclesProxyFactory = await ethers.getContractFactory("ProofOfHumanityCirclesProxy");
    proofOfHumanityCirclesProxy = await ProofOfHumanityCirclesProxyFactory.deploy(
      await proofOfHumanityMock.getAddress(),
      await coreMembersGroupMock.getAddress(),
      await crossChainProofOfHumanityMock.getAddress()
    );

    humanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test")).substring(2, 42);
    expirationTime = Math.floor(Date.now() / 1000) + 3600;

    await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
    await proofOfHumanityMock.mockIsHuman(user1.address, true);

    const humanityInfo = {
      vouching: false,
      pendingRevocation: false,
      nbPendingRequests: 0,
      expirationTime: expirationTime,
      owner: user1.address,
      nbRequests: 1
    };
    await proofOfHumanityMock.mockGetHumanityInfo(humanityID, humanityInfo);

    const crossChainHumanityData = {
      owner: user1.address,
      expirationTime: expirationTime,
      lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
      isHomeChain: false
    };
    await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);

    await crossChainProofOfHumanityMock.mockIsClaimed(humanityID, false);

    await coreMembersGroupMock.reset();
  });

  describe("Constructor", function () {
    it("Should initialize with correct values", async function () {
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await proofOfHumanityMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await coreMembersGroupMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.crossChainProofOfHumanity()).to.equal(await crossChainProofOfHumanityMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.governor()).to.equal(owner.address);
    });
  });

  describe("Governance Functions", function () {
    it("Should allow governor to change Proof of Humanity address", async function () {
      const newPoHMock = await (await ethers.getContractFactory("ProofOfHumanityMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeProofOfHumanity(await newPoHMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await newPoHMock.getAddress());
    });

    it("Should allow governor to change Core Members Group address", async function () {
      const newCoreMembersGroupMock = await (await ethers.getContractFactory("CoreMembersGroupMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeCoreMembersGroup(await newCoreMembersGroupMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await newCoreMembersGroupMock.getAddress());
    });

    it("Should allow governor to change CrossChainProofOfHumanity address", async function () {
      const newCrossChainPoHMock = await (await ethers.getContractFactory("CrossChainProofOfHumanityMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeCrossChainProofOfHumanity(await newCrossChainPoHMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.crossChainProofOfHumanity()).to.equal(await newCrossChainPoHMock.getAddress());
    });

    it("Should allow governor to transfer governorship", async function () {
      await proofOfHumanityCirclesProxy.connect(owner).transferGovernorship(user1.address);
      
      expect(await proofOfHumanityCirclesProxy.governor()).to.equal(user1.address);
    });

    it("Should revert when non-governor tries to change Proof of Humanity address", async function () {
      const newPoHMock = await (await ethers.getContractFactory("ProofOfHumanityMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeProofOfHumanity(await newPoHMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change Core Members Group address", async function () {
      const newCoreMembersGroupMock = await (await ethers.getContractFactory("CoreMembersGroupMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeCoreMembersGroup(await newCoreMembersGroupMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to change CrossChainProofOfHumanity address", async function () {
      const newCrossChainPoHMock = await (await ethers.getContractFactory("CrossChainProofOfHumanityMock")).deploy();
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).changeCrossChainProofOfHumanity(await newCrossChainPoHMock.getAddress())
      ).to.be.revertedWith("Only governor can call this function");
    });

    it("Should revert when non-governor tries to transfer governorship", async function () {
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).transferGovernorship(user2.address)
      ).to.be.revertedWith("Only governor can call this function");
    });
  });

  describe("Register", function () {
    it("Should register a new account successfully when owner isHuman on POH", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(humanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(humanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(expirationTime);
    });

    it("Should register a new account successfully when owner !isHuman (using cross-chain data)", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      const crossChainExpirationTime = Math.floor(Date.now() / 1000) + 7200;

      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);

      const crossChainHumanityData = {
        owner: user1.address,
        expirationTime: crossChainExpirationTime,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(humanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(humanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(crossChainExpirationTime);
    });

    it("Should revert if caller is not the owner of the humanity", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address); 
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user2).register(humanityID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
    });

    it("Should revert when humanity ID is not claimed", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, ethers.ZeroAddress); 
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
    });

    it("Should revert when humanity ID is set as homeChain in cross-chain data", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);
      
      const crossChainHumanityData = {
        owner: user1.address,
        expirationTime: expirationTime,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: true // Setting isHomeChain to true
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount)
      ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should revert if account is already registered", async function () {
      const circlesAccount1 = ethers.Wallet.createRandom().address;
      const circlesAccount2 = ethers.Wallet.createRandom().address;
      
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount1);
      
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(humanityID)).to.equal(circlesAccount1);

      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount2)
      ).to.be.revertedWith("Account is already registered");
    });
  });

  describe("RenewTrust", function () {
    let circlesAccount: string;

    beforeEach(async function () {
      circlesAccount = ethers.Wallet.createRandom().address;
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await coreMembersGroupMock.reset();
    });

    it("Should renew trust successfully when owner isHuman on POH", async function () {
      const newExpirationTime = expirationTime + 3600;

      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, true);
      const updatedHumanityInfo = {
          vouching: false, pendingRevocation: false, nbPendingRequests: 0,
          expirationTime: newExpirationTime,
          owner: user1.address, nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, updatedHumanityInfo);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(newExpirationTime);
    });

    it("Should renew trust successfully when owner is human in cross-chain", async function () {
      const newCrossChainExpirationTime = expirationTime + 7200;

      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);

      const updatedCrossChainData = {
          owner: user1.address,
          expirationTime: newCrossChainExpirationTime,
          lastTransferTime: Math.floor(Date.now() / 1000) - 1000,
          isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, updatedCrossChainData);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(newCrossChainExpirationTime);
    });
    
    it("Should revert if humanity ID is not claimed", async function () {
        await crossChainProofOfHumanityMock.mockBoundTo(humanityID, ethers.ZeroAddress); 
        
        await expect(
          proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID)
        ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should revert when humanity ID is set as homeChain in cross-chain data", async function () {
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, false);
      
      const crossChainHumanityData = {
        owner: user1.address,
        expirationTime: expirationTime,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: true // Setting isHomeChain to true
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanityData);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID)
      ).to.be.revertedWith("Humanity ID is not claimed");
    });
  });

  describe("RevokeTrust", function () {
    let circlesAccount1: string;
    let circlesAccount2: string;
    let humanityID1: string;
    let humanityID2: string;
    let user1CirclesAccount: string;

    beforeEach(async function () {
      humanityID1 = humanityID;
      humanityID2 = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test2")).substring(2, 42);
      
      circlesAccount1 = ethers.Wallet.createRandom().address;
      circlesAccount2 = ethers.Wallet.createRandom().address;
      
      await crossChainProofOfHumanityMock.mockBoundTo(humanityID1, user1.address);
      await proofOfHumanityMock.mockIsHuman(user1.address, true);
      const humanityInfo1 = { vouching: false, pendingRevocation: false, nbPendingRequests: 0, expirationTime: expirationTime, owner: user1.address, nbRequests: 1 };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID1, humanityInfo1);
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID1, circlesAccount1);
      user1CirclesAccount = circlesAccount1;

      await crossChainProofOfHumanityMock.mockBoundTo(humanityID2, user2.address);
      await proofOfHumanityMock.mockIsHuman(user2.address, true);
      const humanityInfo2 = { vouching: false, pendingRevocation: false, nbPendingRequests: 0, expirationTime: expirationTime, owner: user2.address, nbRequests: 1 };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID2, humanityInfo2);
      await proofOfHumanityCirclesProxy.connect(user2).register(humanityID2, circlesAccount2);
      
      // Properly update both mocks to ensure our tests pass
      await proofOfHumanityMock.mockIsClaimed(humanityID1, false);
      await proofOfHumanityMock.mockIsClaimed(humanityID2, false);
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID1, false);
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID2, false);
      
      // Set cross-chain humanity as not active anymore
      const expiredCrossChainData1 = {
        owner: user1.address,
        expirationTime: Math.floor(Date.now() / 1000) - 1000, // expired
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID1, expiredCrossChainData1);
      
      const expiredCrossChainData2 = {
        owner: user2.address,
        expirationTime: Math.floor(Date.now() / 1000) - 1000, // expired
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID2, expiredCrossChainData2);
      
      await coreMembersGroupMock.reset();
    });

    it("Should revoke trust for accounts when humanity is unclaimed", async function () {
      const humanityIDs = [humanityID1, humanityID2];
      const tx = await proofOfHumanityCirclesProxy.revokeTrust(humanityIDs);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs(humanityIDs);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.getLastCalledMembers()).to.deep.equal([circlesAccount1, circlesAccount2]);
      expect(await coreMembersGroupMock.getLastCalledExpiry()).to.equal(0);
    });

    it("Should revoke trust for a single account", async function () {
        const humanityIDs = [humanityID1];
        const tx = await proofOfHumanityCirclesProxy.revokeTrust(humanityIDs);
        
        await expect(tx)
          .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
          .withArgs(humanityIDs);
        
        expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
        expect(await coreMembersGroupMock.getLastCalledMembers()).to.deep.equal([circlesAccount1]);
        expect(await coreMembersGroupMock.getLastCalledExpiry()).to.equal(0);
      });
  
    it("Should handle an empty array gracefully", async function () {
      const humanityIDs: string[] = [];
      const tx = await proofOfHumanityCirclesProxy.revokeTrust(humanityIDs);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs(humanityIDs);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.getLastCalledMembers()).to.deep.equal([]);
      expect(await coreMembersGroupMock.getLastCalledExpiry()).to.equal(0);
    });

    it("Should revert if any humanity ID in the array is still claimed in POH", async function () {
      await proofOfHumanityMock.mockIsClaimed(humanityID1, true);
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID1, false);
      
      const humanityIDs = [humanityID1, humanityID2];
      await expect(
        proofOfHumanityCirclesProxy.revokeTrust(humanityIDs)
      ).to.be.revertedWith("Account is still registered as human");
    });

    it("Should revert if any humanity ID in the array is still active in cross-chain", async function () {
      await proofOfHumanityMock.mockIsClaimed(humanityID2, false);
      
      // Make the second humanity still active in cross-chain
      const activeCrossChainData = {
        owner: user2.address,
        expirationTime: Math.floor(Date.now() / 1000) + 3600, // still valid
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID2, activeCrossChainData);
      
      const humanityIDs = [humanityID1, humanityID2];
      await expect(
        proofOfHumanityCirclesProxy.revokeTrust(humanityIDs)
      ).to.be.revertedWith("Account is still registered as human");
    });
  });
}); 