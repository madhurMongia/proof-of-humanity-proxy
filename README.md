# ProofOfHumanityCirclesProxy

A proxy contract to integrate [Proof of Humanity](https://v2.proofofhumanity.id/) with [Circles](https://www.aboutcircles.com), enabling seamless verification of human identity for Circles Groups.

## Overview

This project implements a proxy contract that allows Circles to verify human identity using the Proof of Humanity registry. The proxy acts as a bridge between these two systems, enabling Circles to leverage PoH's verification mechanism.

## Features

- Integrates Proof of Humanity verification with Circles
- Adds verified humans to Circles as members
- Allows removal of members who are no longer verified by PoH
- Supports governance control for admin operations

## Technical Architecture

The `ProofOfHumanityCirclesProxy` contract serves as a bridge between the Proof of Humanity registry and the Circles Core Members Group. It allows:

1. Adding members to Circles if they're verified in Proof of Humanity
2. Removing members from Circles if they're no longer verified

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- An Ethereum wallet with testnet ETH (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ProofOfHumanityCirclesProxy.git
cd ProofOfHumanityCirclesProxy

# Install dependencies
npm install

# Copy the environment example file
cp .env.example .env
```

### Configuration

Edit the `.env` file and add your configuration values:

```
# Network API Keys
INFURA_API_KEY=your_infura_api_key
ALCHEMY_API_KEY=your_alchemy_api_key

# Deployment
PRIVATE_KEY=your_private_key_here

# Verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Parameters
PROOF_OF_HUMANITY_ADDRESS=0x1000000000000000000000000000000000000000
CORE_MEMBERS_GROUP_ADDRESS=0x2000000000000000000000000000000000000000
```

### Compiling

```bash
npx hardhat compile
```

### Testing

```bash
npx hardhat test
```

## Deployment and Verification

You can deploy the contract using either Hardhat scripts or Hardhat Ignition.

### Using Hardhat Scripts

```bash
# Deploy to a local Hardhat node
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# Deploy to a testnet (Sepolia)
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet
```

The deployment script automatically attempts to verify the contract on Etherscan.

### Using Hardhat Ignition

```bash
# Deploy to a local Hardhat node
npx hardhat ignition deploy ignition/modules/deploy.ts --network localhost

# Deploy to a testnet (Sepolia)
npx hardhat ignition deploy ignition/modules/deploy.ts --network sepolia

# Deploy to mainnet
npx hardhat ignition deploy ignition/modules/deploy.ts --network mainnet
```

### Manual Verification

If the automatic verification fails, you can manually verify the contract:

```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> <PROOF_OF_HUMANITY_ADDRESS> <CORE_MEMBERS_GROUP_ADDRESS>
```

### Flattening Contract for Verification

If you need to manually verify the contract on Etherscan, you can flatten it:

```bash
npx hardhat flatten contracts/ProofOfHumanityCirclesProxy.sol > ProofOfHumanityCirclesProxy_flattened.sol
```

## Contract Addresses

- Sepolia Testnet: `TBD`
- Mainnet: `TBD`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
