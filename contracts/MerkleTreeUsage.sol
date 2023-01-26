// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title Demonstration contract of Merkle tree usage.
 * Allows to claim BASE tokens for users that have proofs about having BASE token rewards.
 *
 * @dev This contract includes the following functionality:
 * - Claim BASE tokens.
 * - Update Merkle tree root.
 * - Update BASE token address.
 * - Set isClaimed value. Aimed to be used to block users.
 */
contract MerkleTreeUsage is OwnableUpgradeable {
    // _______________ Storage _______________

    /// @dev Merkle tree root.
    bytes32 public root;

    /// @dev BASE token address.
    IERC20Upgradeable public base;

    /// @dev Users who have already claimed their tokens.
    mapping(address => bool) public isClaimed;

    // _______________ Errors _______________

    /// @dev Revert if zero address is passed.
    error ZeroAddress();

    /// @dev Revert if user has already claimed.
    error AlreadyClaimed(address user);

    /// @dev Revert when validation of the merkle proof fails.
    error ProofFailed(address user, uint256 amount, bytes32[] proof);

    // _______________ Events _______________

    /**
     * @dev Emitted when the claim is successful.
     * @param _user   Address of the user.
     * @param _amount   Amount of the claim.
     */
    event Claim(address indexed _user, uint256 indexed _amount);

    /**
     * @dev Emitted when the root is updated.
     */
    event RootUpdated(bytes32 indexed _root);

    /**
     * @dev Emitted when the BASE token address is updated.
     */
    event BaseUpdated(address indexed _base);

    /**
     * @dev Emitted when isClaimed value is set.
     */
    event IsClaimedUpdated(address indexed _user, bool indexed _isClaimed);

    // _______________ Modifiers _______________

    /**
     * @dev Zero address check.
     */
    modifier notZeroAddress(address _address) {
        if (_address == address(0)) {
            revert ZeroAddress();
        }
        _;
    }

    // _______________ Initializer ______________

    /**
     * @dev Initialize the contract.
     * @param _root Merkle tree root.
     */
    function initialize(bytes32 _root, IERC20Upgradeable _base) public initializer notZeroAddress(address(_base)) {
        __Ownable_init();
        _setRoot(_root);
        _setBase(_base);
    }

    // _______________ External functions _______________

    /**
     * @dev Claim BASE tokens.
     * Requirements:
     * - User must not have claimed yet.
     * - Contract must have enough BASE tokens to transfer.
     * - User must be in the claim list.
     * @param _amount Amount to claim.
     * @param _proof Merkle proof.
     */
    function claim(uint256 _amount, bytes32[] calldata _proof) external {
        if (isClaimed[msg.sender]) {
            revert AlreadyClaimed(msg.sender);
        }
        if (!checkClaimProof(msg.sender, _amount, _proof)) {
            revert ProofFailed(msg.sender, _amount, _proof);
        }
        _setIsClaimed(msg.sender, true);
        base.transfer(msg.sender, _amount);
        emit Claim(msg.sender, _amount);
    }

    // Admin functions
    /**
     * @dev Set the Merkle tree root.
     * @param _root Merkle tree root.
     */
    function setRoot(bytes32 _root) external onlyOwner {
        _setRoot(_root);
    }

    /**
     * @dev Set the BASE token address.
     * Requirements:
     * - BASE token address must not be zero address.
     * @param _base BASE token address.
     */
    function setBase(IERC20Upgradeable _base) external onlyOwner {
        _setBase(_base);
    }

    // _______________ Public functions _______________
    /**
     * @dev Returns true if user and amount are in the merkle tree (if provided proof is valid).
     * @param _user Address of the user.
     * @param _amount Amount to claim.
     * @param _proof Merkle proof.
     * @return True if user and amount are in the merkle tree.
     */
    function checkClaimProof(
        address _user,
        uint256 _amount,
        bytes32[] memory _proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_user, _amount))));
        return MerkleProofUpgradeable.verify(_proof, root, leaf);
    }

    // _______________ Internal functions _______________
    /**
     * @dev Set if user is already claimed. Aimed to be used to blacklist users.
     * Requirements:
     * - User must not be zero address.
     * @param _user Address of the user.
     * @param _isClaimed True if user is banned from claiming.
     */
    function _setIsClaimed(address _user, bool _isClaimed) internal notZeroAddress(_user) {
        isClaimed[_user] = _isClaimed;
        emit IsClaimedUpdated(_user, _isClaimed);
    }

    /**
     * @dev Set the Merkle tree root.
     * @param _root Merkle tree root.
     */
    function _setRoot(bytes32 _root) internal {
        root = _root;
        emit RootUpdated(_root);
    }

    /**
     * @dev Set the BASE token address.
     * Requirements:
     * - BASE token address must not be zero address.
     * @param _base BASE token address.
     */
    function _setBase(IERC20Upgradeable _base) internal notZeroAddress(address(_base)) {
        base = _base;
        emit BaseUpdated(address(_base));
    }
}
