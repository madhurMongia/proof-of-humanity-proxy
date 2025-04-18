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

    await proofOfHumanityMock.mockIsClaimed(humanityID, true);
    
    const humanityInfo = {
      vouching: false,
      pendingRevocation: false,
      nbPendingRequests: 0,
      expirationTime: expirationTime,
      owner: user1.address,
      nbRequests: 1
    };
    await proofOfHumanityMock.mockGetHumanityInfo(humanityID, humanityInfo);

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
    it("Should register a new account successfully on home chain", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await proofOfHumanityMock.mockIsClaimed(humanityID, true);
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(humanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(humanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(expirationTime);
    });

    it("Should register a new account successfully on non-home chain", async function () {
      const nonHomeChainHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("nonHomeChain")).substring(2, 42);
      const nonHomeChainExpiry = Math.floor(Date.now() / 1000) + 7200;

      await proofOfHumanityMock.mockIsClaimed(nonHomeChainHumanityID, false);
      const zeroOwnerHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: 0,
        owner: ethers.ZeroAddress, 
        nbRequests: 0
      };
      await proofOfHumanityMock.mockGetHumanityInfo(nonHomeChainHumanityID, zeroOwnerHumanityInfo);

      const crossChainHumanity = {
        owner: user1.address,
        expirationTime: nonHomeChainExpiry,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(nonHomeChainHumanityID, crossChainHumanity);

      const circlesAccount = ethers.Wallet.createRandom().address;
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(nonHomeChainHumanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(nonHomeChainHumanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(nonHomeChainHumanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(nonHomeChainExpiry);
    });

    it("Should revert if caller is not the owner of humanity ID", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user2).register(humanityID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
    });

    it("Should revert if account is already registered", async function () {
      const circlesAccount1 = ethers.Wallet.createRandom().address;
      const circlesAccount2 = ethers.Wallet.createRandom().address;
      
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount1);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount2)
      ).to.be.revertedWith("Account is already registered");
    });

    it("Should handle revoked humanities and non-existent humanities", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      const revokedHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("revoked")).substring(2, 42);
      
      await proofOfHumanityMock.mockIsClaimed(revokedHumanityID, true);
      const revokedHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expirationTime,
        owner: ethers.ZeroAddress,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(revokedHumanityID, revokedHumanityInfo);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(revokedHumanityID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
      
      const crossChainRevokedID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("crossChainRevoked")).substring(2, 42);
      
      await proofOfHumanityMock.mockIsClaimed(crossChainRevokedID, false);
      const zeroOwnerHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: 0,
        owner: ethers.ZeroAddress,
        nbRequests: 0
      };
      await proofOfHumanityMock.mockGetHumanityInfo(crossChainRevokedID, zeroOwnerHumanityInfo);
      
      const crossChainRevokedHumanity = {
        owner: ethers.ZeroAddress,
        expirationTime: expirationTime,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(crossChainRevokedID, crossChainRevokedHumanity);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(crossChainRevokedID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
      
      const nonExistentID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("nonExistent")).substring(2, 42);
      
      await proofOfHumanityMock.mockIsClaimed(nonExistentID, false);
      await proofOfHumanityMock.mockGetHumanityInfo(nonExistentID, zeroOwnerHumanityInfo);
      
      const defaultCrossChainHumanity = {
        owner: ethers.ZeroAddress,
        expirationTime: 0,
        lastTransferTime: 0,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(nonExistentID, defaultCrossChainHumanity);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(nonExistentID, circlesAccount)
      ).to.be.revertedWith("You are not the owner of this humanity ID");
    });

    it("Should register successfully even if humanity is expired but not revoked", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      const expiredHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("expired")).substring(2, 42);
      
      await proofOfHumanityMock.mockIsClaimed(expiredHumanityID, true);
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expiredTime,
        owner: user1.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(expiredHumanityID, expiredHumanityInfo);
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(expiredHumanityID, circlesAccount);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(expiredHumanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(expiredHumanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(expiredTime);
    });
  });

  describe("RenewTrust", function () {
    let circlesAccount: string;

    beforeEach(async function () {
      circlesAccount = ethers.Wallet.createRandom().address;
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await coreMembersGroupMock.reset();
    });

    it("Should renew trust successfully on home chain and allow anyone to call it", async function () {
      const newExpirationTime = expirationTime + 3600;
      const updatedHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: newExpirationTime,
        owner: user1.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, updatedHumanityInfo);
      await proofOfHumanityMock.mockIsClaimed(humanityID, true);

      const tx = await proofOfHumanityCirclesProxy.connect(user2).renewTrust(humanityID);
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(newExpirationTime);
    });

    it("Should renew trust successfully on non-home chain", async function () {
      const nonHomeChainExpiry = expirationTime + 7200;

      const zeroOwnerHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: 0,
        owner: ethers.ZeroAddress,
        nbRequests: 0
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, zeroOwnerHumanityInfo);

      const crossChainHumanity = {
        owner: user1.address,
        expirationTime: nonHomeChainExpiry,
        lastTransferTime: Math.floor(Date.now() / 1000) - 86400,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(humanityID, crossChainHumanity);

      const tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(nonHomeChainExpiry);
    });

    it("Should revert when the humanity ID is not claimed", async function () {
      const notClaimedHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("notClaimed")).substring(2, 42);
      
      const zeroOwnerHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: 0,
        owner: ethers.ZeroAddress,
        nbRequests: 0
      };
      await proofOfHumanityMock.mockGetHumanityInfo(notClaimedHumanityID, zeroOwnerHumanityInfo);
      
      const zeroOwnerCrossChainHumanity = {
        owner: ethers.ZeroAddress,
        expirationTime: 0,
        lastTransferTime: 0,
        isHomeChain: false
      };
      await crossChainProofOfHumanityMock.mockHumanityData(notClaimedHumanityID, zeroOwnerCrossChainHumanity);

      await expect(
        proofOfHumanityCirclesProxy.connect(user1).renewTrust(notClaimedHumanityID)
      ).to.be.revertedWith("Humanity ID is not claimed");
    });

    it("Should handle expired and revoked humanities", async function () {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expiredTime,
        owner: user1.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, expiredHumanityInfo);
      await proofOfHumanityMock.mockIsClaimed(humanityID, true);

      let tx = await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "TrustRenewed")
        .withArgs(humanityID, circlesAccount);

      expect( await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      
      await coreMembersGroupMock.reset();
      
      const RevokedHumanityInfo = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expirationTime,
        owner: ethers.ZeroAddress, 
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID, RevokedHumanityInfo);
      await proofOfHumanityMock.mockIsClaimed(humanityID, true);

      await expect(proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID))
      .to.be.revertedWith("Humanity ID is not claimed");
      
    });
  });

  describe("RevokeTrust", function () {
    let circlesAccount1: string;
    let circlesAccount2: string;
    let humanityID1: string;
    let humanityID2: string;

    beforeEach(async function () {
      humanityID1 = humanityID;
      humanityID2 = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test2")).substring(2, 42);
      
      circlesAccount1 = ethers.Wallet.createRandom().address;
      circlesAccount2 = ethers.Wallet.createRandom().address;
      
      await proofOfHumanityMock.mockIsClaimed(humanityID1, true);
      await proofOfHumanityMock.mockIsClaimed(humanityID2, true);
      
      const humanityInfo2 = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expirationTime,
        owner: user1.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID2, humanityInfo2);
      
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID1, false);
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID2, false);
      
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID1, circlesAccount1);
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID2, circlesAccount2);
      
      await coreMembersGroupMock.reset();
    });

    it("Should revoke trust for accounts when humanity is no longer claimed", async function () {
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID1, false);
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID2, false);
      
      const humanityIDs = [humanityID1, humanityID2];
      let tx = await proofOfHumanityCirclesProxy.revokeTrust(humanityIDs);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs(humanityIDs);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(0);
      
      await coreMembersGroupMock.reset();
      
      tx = await proofOfHumanityCirclesProxy.revokeTrust([humanityID1]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([humanityID1]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(0);
      
      await coreMembersGroupMock.reset();
      
      const unregisteredHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("unregistered")).substring(2, 42);
      await crossChainProofOfHumanityMock.mockIsClaimed(unregisteredHumanityID, false);
      
      tx = await proofOfHumanityCirclesProxy.revokeTrust([unregisteredHumanityID]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([unregisteredHumanityID]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      
      await coreMembersGroupMock.reset();
      
      tx = await proofOfHumanityCirclesProxy.revokeTrust([]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
    });

    it("Should revert if any humanity is still claimed", async function () {
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID1, false);
      
      await crossChainProofOfHumanityMock.mockIsClaimed(humanityID2, true);
      
      const humanityIDs = [humanityID1, humanityID2];
      await expect(
        proofOfHumanityCirclesProxy.revokeTrust(humanityIDs)
      ).to.be.revertedWith("Account is still registered as human");
    });
  });
}); 