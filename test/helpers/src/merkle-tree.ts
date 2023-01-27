import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

function generateMerkleTree(claimList: [string, string][]) {
    const merkleTree = StandardMerkleTree.of(claimList, ["address", "uint256"]);
    return merkleTree;
}

export { generateMerkleTree };
