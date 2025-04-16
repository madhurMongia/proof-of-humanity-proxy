import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { 
    ProofOfHumanityCirclesProxy,
    ProofOfHumanityMock,
    CoreMembersGroupMock,
} from "../typechain-types";


describe("ProofOfHumanityCirclesProxy", function () {
  let proofOfHumanityCirclesProxy: ProofOfHumanityCirclesProxy;
  let proofOfHumanityMock: ProofOfHumanityMock;
  let coreMembersGroupMock: CoreMembersGroupMock;
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

    const ProofOfHumanityCirclesProxyFactory = await ethers.getContractFactory("ProofOfHumanityCirclesProxy");
    proofOfHumanityCirclesProxy = await ProofOfHumanityCirclesProxyFactory.deploy(
      await proofOfHumanityMock.getAddress(),
      await coreMembersGroupMock.getAddress()
    );

    humanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("test")).substring(2, 42);
    expirationTime = Math.floor(Date.now() / 1000) + 3600;

    await proofOfHumanityMock.mockIsHuman(user1.address, true);
    await proofOfHumanityMock.mockIsClaimed(humanityID, true);
    await proofOfHumanityMock.mockHumanityOf(user1.address, humanityID);
    
    const humanityInfo = {
      vouching: false,
      pendingRevocation: false,
      nbPendingRequests: 0,
      expirationTime: expirationTime,
      owner: user1.address,
      nbRequests: 1
    };
    await proofOfHumanityMock.mockGetHumanityInfo(humanityID, humanityInfo);

    await coreMembersGroupMock.reset();
  });

  describe("Constructor", function () {
    it("Should initialize with correct values", async function () {
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await proofOfHumanityMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await coreMembersGroupMock.getAddress());
      expect(await proofOfHumanityCirclesProxy.governor()).to.equal(owner.address);
      expect(await proofOfHumanityCirclesProxy.UNTRUST_EXPIRY_TIMESTAMP()).to.equal(0);
    });
  });

  describe("Governance Functions", function () {
    it("Should allow governor to   change Proof of Humanity address", async function () {
      const newPoHMock = await (await ethers.getContractFactory("ProofOfHumanityMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeProofOfHumanity(await newPoHMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.proofOfHumanity()).to.equal(await newPoHMock.getAddress());
    });

    it("Should allow governor to change Core Members Group address", async function () {
      const newCoreMembersGroupMock = await (await ethers.getContractFactory("CoreMembersGroupMock")).deploy();
      
      await proofOfHumanityCirclesProxy.connect(owner).changeCoreMembersGroup(await newCoreMembersGroupMock.getAddress());
      
      expect(await proofOfHumanityCirclesProxy.coreMembersGroup()).to.equal(await newCoreMembersGroupMock.getAddress());
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

    it("Should revert when non-governor tries to transfer governorship", async function () {
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).transferGovernorship(user2.address)
      ).to.be.revertedWith("Only governor can call this function");
    });
  });

  describe("Register", function () {
    it("Should register a new account successfully", async function () {
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      const tx = await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);

      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MemberRegistered")
        .withArgs(humanityID, circlesAccount);
  
      expect(await proofOfHumanityCirclesProxy.humanityIDToCriclesAccount(humanityID)).to.equal(circlesAccount);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(expirationTime);
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

    it("Should revert if account is not a human", async function () {
      await proofOfHumanityMock.mockIsHuman(user1.address, false);
      
      const circlesAccount = ethers.Wallet.createRandom().address;
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount)
      ).to.be.revertedWith("Account is not a human");
    });
  });

  describe("RenewTrust", function () {
    let circlesAccount: string;

    beforeEach(async function () {
      circlesAccount = ethers.Wallet.createRandom().address;
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID, circlesAccount);
      await coreMembersGroupMock.reset();
    });

    it("Should renew trust successfully", async function () {
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

      await proofOfHumanityCirclesProxy.connect(user1).renewTrust(humanityID);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(newExpirationTime);
    });

    it("Should allow anyone to call renewTrust, not just the owner (security vulnerability)", async function () {
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

      await proofOfHumanityCirclesProxy.connect(user2).renewTrust(humanityID);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(newExpirationTime);
    });

    it("Should revert if account is not registered", async function () {
      const unregisteredHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("unregistered")).substring(2, 42);
      
      await expect(
        proofOfHumanityCirclesProxy.connect(user1).renewTrust(unregisteredHumanityID)
      ).to.be.revertedWith("Account is not registered");
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
      
      const humanityInfo2 = {
        vouching: false,
        pendingRevocation: false,
        nbPendingRequests: 0,
        expirationTime: expirationTime,
        owner: user1.address,
        nbRequests: 1
      };
      await proofOfHumanityMock.mockGetHumanityInfo(humanityID2, humanityInfo2);
      await proofOfHumanityMock.mockIsClaimed(humanityID2, true);
      
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID1, circlesAccount1);
      await proofOfHumanityCirclesProxy.connect(user1).register(humanityID2, circlesAccount2);
      
      await coreMembersGroupMock.reset();
    });

    it("Should revoke trust for multiple accounts successfully", async function () {
      await proofOfHumanityMock.mockIsClaimed(humanityID1, false);
      await proofOfHumanityMock.mockIsClaimed(humanityID2, false);
      
      const humanityIDs = [humanityID1, humanityID2];
      const tx = await proofOfHumanityCirclesProxy.revokeTrust(humanityIDs);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved");
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(0);
    });

    it("Should revert if any humanity is still claimed", async function () {
      await proofOfHumanityMock.mockIsClaimed(humanityID1, false);
      
      const humanityIDs = [humanityID1, humanityID2];
      await expect(
        proofOfHumanityCirclesProxy.revokeTrust(humanityIDs)
      ).to.be.revertedWith("Account is still registered as human");
    });

    it("Should handle empty array of humanity IDs", async function () {
      const tx = await proofOfHumanityCirclesProxy.revokeTrust([]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
    });

    it("Should handle revoking trust for a single humanity ID", async function () {
      await proofOfHumanityMock.mockIsClaimed(humanityID1, false);
      
      const tx = await proofOfHumanityCirclesProxy.revokeTrust([humanityID1]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([humanityID1]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
      expect(await coreMembersGroupMock.lastTrustExpiry()).to.equal(0);
    });

    it("Should handle unregistered humanity IDs gracefully", async function () {
      const unregisteredHumanityID = "0x" + ethers.keccak256(ethers.toUtf8Bytes("unregistered")).substring(2, 42);
      
      await proofOfHumanityMock.mockIsClaimed(unregisteredHumanityID, false);
      
      const tx = await proofOfHumanityCirclesProxy.revokeTrust([unregisteredHumanityID]);
      
      await expect(tx)
        .to.emit(proofOfHumanityCirclesProxy, "MembersRemoved")
        .withArgs([unregisteredHumanityID]);
      
      expect(await coreMembersGroupMock.trustBatchWasCalled()).to.be.true;
    });
  });
}); 