# ProofOfHumanityCirclesProxy

A proxy contract to integrate [Proof of Humanity](https://v2.proofofhumanity.id/) with [Circles](https://www.aboutcircles.com), enabling seamless verification of human identity for Circles Groups.

## Overview

This project implements a proxy contract that allows Circles to verify human identity using the Proof of Humanity registry. The proxy acts as a bridge between these two systems, enabling Circles to leverage PoH's verification mechanism.

## Features


## Technical Architecture


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
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Compiling

```bash
npm run compile
```

### Testing

```bash
npm test
```

### Deployment

```bash
# Deploy to a local Hardhat node
npm run node
npm run deploy

# Deploy to a testnet (Goerli)
npm run deploy -- --network goerli
```

## Contract Addresses

- Goerli Testnet: `TBD`
- Mainnet: `TBD`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
