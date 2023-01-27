import { BigNumberish } from "ethers";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { upgrades } from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { generateMerkleTree } from "./helpers";

import { MerkleTreeUsage, ERC20Mock } from "../typechain-types";
const constants = ethers.constants;
// eslint-disable-next-line @typescript-eslint/unbound-method
const toBN = ethers.BigNumber.from;
describe("MerkleTreeUsage", function () {
    let snapshotA: SnapshotRestorer;

    // Signers.
    let deployer: SignerWithAddress, alice: SignerWithAddress, bob: SignerWithAddress;

    let claimListSize = 20;
    let claimList: [string, string][];
    let merkleTree: StandardMerkleTree<[string, string]>;
    let merkleRoot: string;

    let claim: MerkleTreeUsage;
    let base: ERC20Mock;
    const totalSupply = toBN(10).pow(18 + 7);
    before(async () => {
        // Getting of signers.
        [deployer, bob] = await ethers.getSigners();

        // Generate claim list
        claimList = [];

        // add alice to the list
        alice = deployer;
        claimListSize++;

        claimList.push([alice.address, randomBN(totalSupply.div(claimListSize)).toString()]);

        // add random addresses to the list
        for (let i = 0; i < claimListSize; i++) {
            claimList.push([ethers.Wallet.createRandom().address, randomBN(totalSupply.div(claimListSize)).toString()]);
        }

        function randomBN(max: BigNumberish) {
            return ethers.BigNumber.from(ethers.utils.randomBytes(32)).mod(max);
        }

        // Generate merkle tree
        merkleTree = generateMerkleTree(claimList);
        merkleRoot = merkleTree.root;

        // Deploy base token
        const baseToken = await ethers.getContractFactory("ERC20Mock", deployer);
        base = await baseToken.deploy(totalSupply);
        await base.deployed();

        // Deploy MerkleTreeUsage
        const MerkleTreeUsage = await ethers.getContractFactory("MerkleTreeUsage", deployer);
        claim = (await upgrades.deployProxy(MerkleTreeUsage, [merkleRoot, base.address])) as MerkleTreeUsage;

        // transfer total supply to claim contract
        await base.transfer(claim.address, totalSupply);

        snapshotA = await takeSnapshot();
    });

    afterEach(async () => await snapshotA.restore());

    describe("Initialization", () => {
        it("Should initialize correctly", async () => {
            expect(await claim.root()).to.be.equal(merkleRoot);
            expect(await claim.base()).to.be.equal(base.address);
        });
        it("Should revert if base is zero address", async () => {
            const MerkleTreeUsage = await ethers.getContractFactory("MerkleTreeUsage", deployer);
            await expect(
                upgrades.deployProxy(MerkleTreeUsage, [merkleRoot, constants.AddressZero])
            ).to.be.revertedWithCustomError(claim, "ZeroAddress");
        });
        it("Shouldn't be able to initialize twice", async () => {
            await expect(claim.initialize(merkleRoot, base.address)).to.be.revertedWith(
                "Initializable: contract is already initialized"
            );
        });
    });

    describe("Setters", () => {
        it("Should set root correctly", async () => {
            const newRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const tx = await claim.setRoot(newRoot);
            await expect(tx).to.emit(claim, "RootUpdated").withArgs(newRoot);
            expect(await claim.root()).to.be.equal(newRoot);
        });
        it("Should set base correctly", async () => {
            const newbase = bob.address;
            const tx = await claim.setBase(newbase);

            await expect(tx).to.emit(claim, "BaseUpdated").withArgs(newbase);
            expect(await claim.base()).to.be.equal(newbase);
        });
        it("Should revert if setting zero-address as base", async () => {
            await expect(claim.setBase(ethers.constants.AddressZero)).to.be.revertedWithCustomError(
                claim,
                "ZeroAddress"
            );
        });
        it("All setters should revert if called by non-owner", async () => {
            const newRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const newbase = bob.address;

            await expect(claim.connect(bob).setRoot(newRoot)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(claim.connect(bob).setBase(newbase)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
    describe("Claim", () => {
        it("Should claim if claim is active and proof is correct", async () => {
            const { proof, leaf } = getTreeEntry(merkleTree, alice.address);

            expect(await base.balanceOf(alice.address)).to.be.equal(0);

            const tx = await claim.claim(leaf[1], proof);

            await expect(tx).to.emit(claim, "Claim").withArgs(alice.address, leaf[1]);
            await expect(tx).to.emit(base, "Transfer").withArgs(claim.address, alice.address, leaf[1]);
            await expect(tx).to.emit(claim, "IsClaimedUpdated").withArgs(alice.address, true);

            expect(await claim.isClaimed(alice.address)).to.be.equal(true);
            expect(await base.balanceOf(alice.address)).to.be.equal(leaf[1]);
        });
        it("Should revert if proof is invalid", async () => {
            const proof = ["0x0000000000000000000000000000000000000000000000000000000000000000"];
            const amount = toBN(77).pow(18 + 6);
            await expect(claim.claim(amount, proof))
                .to.be.revertedWithCustomError(claim, "ProofFailed")
                .withArgs(alice.address, amount, proof);
        });
        it("Should revert if user has already claimed", async () => {
            const { proof, leaf } = getTreeEntry(merkleTree, alice.address);

            await claim.claim(leaf[1], proof);

            await expect(claim.claim(leaf[1], proof))
                .to.be.revertedWithCustomError(claim, "AlreadyClaimed")
                .withArgs(alice.address);
        });
    });
});

function getTreeEntry(
    tree: StandardMerkleTree<[string, string]>,
    address: string
): { proof: string[]; leaf: [string, string] } {
    for (const [i, v] of tree.entries()) {
        if (v[0] === address) {
            const proof = tree.getProof(i);
            return {
                proof,
                leaf: v
            };
        }
    }
    throw new Error("Address not found in tree");
}
