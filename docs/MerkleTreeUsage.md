# Solidity API

## MerkleTreeUsage

_This contract includes the following functionality:
- Claim BASE tokens.
- Update Merkle tree root.
- Update BASE token address.
- Set isClaimed value. Aimed to be used to block users._

### root

```solidity
bytes32 root
```

_Merkle tree root._

### base

```solidity
contract IERC20Upgradeable base
```

_BASE token address._

### isClaimed

```solidity
mapping(address => bool) isClaimed
```

_Users who have already claimed their tokens._

### ZeroAddress

```solidity
error ZeroAddress()
```

_Revert if zero address is passed._

### AlreadyClaimed

```solidity
error AlreadyClaimed(address user)
```

_Revert if user has already claimed._

### ProofFailed

```solidity
error ProofFailed(address user, uint256 amount, bytes32[] proof)
```

_Revert when validation of the merkle proof fails._

### Claim

```solidity
event Claim(address _user, uint256 _amount)
```

_Emitted when the claim is successful._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | Address of the user. |
| _amount | uint256 | Amount of the claim. |

### RootUpdated

```solidity
event RootUpdated(bytes32 _root)
```

_Emitted when the root is updated._

### BaseUpdated

```solidity
event BaseUpdated(address _base)
```

_Emitted when the BASE token address is updated._

### IsClaimedUpdated

```solidity
event IsClaimedUpdated(address _user, bool _isClaimed)
```

_Emitted when isClaimed value is set._

### notZeroAddress

```solidity
modifier notZeroAddress(address _address)
```

_Zero address check._

### initialize

```solidity
function initialize(bytes32 _root, contract IERC20Upgradeable _base) public
```

_Initialize the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _root | bytes32 | Merkle tree root. |
| _base | contract IERC20Upgradeable |  |

### claim

```solidity
function claim(uint256 _amount, bytes32[] _proof) external
```

_Claim BASE tokens.
Requirements:
- User must not have claimed yet.
- Contract must have enough BASE tokens to transfer.
- User must be in the claim list._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | Amount to claim. |
| _proof | bytes32[] | Merkle proof. |

### setRoot

```solidity
function setRoot(bytes32 _root) external
```

_Set the Merkle tree root._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _root | bytes32 | Merkle tree root. |

### setBase

```solidity
function setBase(contract IERC20Upgradeable _base) external
```

_Set the BASE token address.
Requirements:
- BASE token address must not be zero address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _base | contract IERC20Upgradeable | BASE token address. |

### checkClaimProof

```solidity
function checkClaimProof(address _user, uint256 _amount, bytes32[] _proof) public view returns (bool)
```

_Returns true if user and amount are in the merkle tree (if provided proof is valid)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | Address of the user. |
| _amount | uint256 | Amount to claim. |
| _proof | bytes32[] | Merkle proof. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if user and amount are in the merkle tree. |

### _setIsClaimed

```solidity
function _setIsClaimed(address _user, bool _isClaimed) internal
```

_Set if user is already claimed. Aimed to be used to blacklist users.
Requirements:
- User must not be zero address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _user | address | Address of the user. |
| _isClaimed | bool | True if user is banned from claiming. |

### _setRoot

```solidity
function _setRoot(bytes32 _root) internal
```

_Set the Merkle tree root._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _root | bytes32 | Merkle tree root. |

### _setBase

```solidity
function _setBase(contract IERC20Upgradeable _base) internal
```

_Set the BASE token address.
Requirements:
- BASE token address must not be zero address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _base | contract IERC20Upgradeable | BASE token address. |

