# GetMeFcknAbi - Smart Contract Explorer

<div align="center">
  <div style="font-size: 100px;">🔥</div>
  
  <h1>🔥 No more wasting time on Hardhat & Etherscan - just get me fckin' ABI! 🔥</h1>
  
  <p>
    <b>⚡️ Instantly extract ABIs from any smart contract across any EVM chain ⚡️</b>
  </p>
  
  <p>
    <a href="https://www.npmjs.com/package/getmefcknabi"><img src="https://img.shields.io/npm/v/getmefcknabi.svg" alt="npm version" /></a>
    <a href="https://www.npmjs.com/package/getmefcknabi"><img src="https://img.shields.io/npm/dm/getmefcknabi.svg" alt="downloads" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/bezata/getmefcknabi.svg" alt="license" /></a>
  </p>
</div>

## ✨ Quick Start

```bash
# Install globally
npm install -g getmefcknabi

# Grab an ABI in seconds
getmefcknabi -a 0xYourContractAddress -c 1 -f json

# Or use interactive mode for a guided experience
getmefcknabi --interactive
```

## 🚀 What's GetMeFcknABI?

Tired of:
- 😫 Searching for contract ABIs on Etherscan?
- 😤 Setting up Hardhat with Etherscan API keys?
- 😩 Dealing with unverified contracts?

**GetMeFcknABI** is your one-stop solution! A powerful CLI tool that:

- 🔍 Extracts ABIs from ANY contract (even unverified ones!)
- ⚡ Works across ALL EVM chains
- 🎨 Provides beautiful terminal output
- 📝 Supports JSON and TypeScript formats
- 🌉 Resolves proxy contracts automatically
- 💻 Has a super-smooth interactive mode

## ⚙️ CLI Features

```bash
# Run in interactive mode with a guided UI
getmefcknabi --interactive

# Extract ABI directly
getmefcknabi -a 0xContractAddress -c 1 -f json

# Use a custom RPC with TypeScript output
getmefcknabi -a 0xContractAddress -c 137 -r https://your-rpc-url.com -f typescript

# Save to a specific file
getmefcknabi -a 0xContractAddress -c 1 -f json -o ./contracts/MyContract.json
```

[Learn more about the CLI →](./packages/cli/README.md)

---

## 🔍 Contract Explorer UI

A simplified Ethereum contract explorer and interaction tool based on WhatsABI. This application allows users to easily explore contract ABIs, view function signatures, and interact with smart contracts across multiple chains without needing to have the contract source code or official ABI.

### Features

- **Advanced Contract ABI Detection**: Automatically detect contract ABIs using multiple sources:
  - Bytecode signature analysis
  - Sourcify decentralized repository
  - Etherscan verified contracts
  - Multiple signature databases (4Byte, OpenChain)
- **Multi-Chain Support**: Works with Ethereum, Polygon, Optimism, Arbitrum, and custom networks
- **Proxy Contract Detection**: Automatically detects and works with proxy contracts
- **Contract Function Explorer**: View and interact with all available contract functions
- **ABI Explorer**: Visual and JSON representation of the contract's ABI
- **Read Contract Data**: Call view/pure functions directly from the UI
- **Prepare Transactions**: Generate transaction data for write functions to use with your wallet
- **Local ABI Caching**: Caches ABIs to reduce API calls
- **RPC Management**: Automatic fallback to healthy RPC endpoints and support for custom RPC URLs

## Supported Networks

This application supports a wide range of EVM-compatible networks:

### Mainnets
- Ethereum
- Polygon
- Optimism
- Arbitrum
- Base
- BNB Smart Chain
- Avalanche
- Fantom
- Mode

### Testnets
- Ethereum Sepolia
- Polygon Mumbai
- Optimism Sepolia
- Arbitrum Sepolia
- Base Sepolia
- BNB Smart Chain Testnet
- Avalanche Fuji
- Fantom Testnet

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- A web browser with MetaMask or another Ethereum wallet (for sending transactions)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/bezata/getmefcknabi.git
   cd getmefcknabi
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on the example:
   ```bash
   cp .env.local.example .env.local
   ```
   
4. Edit the `.env.local` file to include your API keys and custom RPC URLs if needed:
   - Set your Alchemy API key for RPC access
   - Set your Etherscan API key for source verification (optional)

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

1. **Enter a Contract Address**: Input any Ethereum contract address and select the chain (Ethereum Mainnet, Polygon, etc.)

2. **Explore Contract**: View all available functions, grouped by read and write operations

3. **View Contract ABI**: Click the "ABI" tab to see the full contract ABI in both visual and JSON formats

4. **Call Read Functions**:
   - Select any view or pure function from the list
   - Enter the required parameters
   - Click "Call Function" to execute and see the results

5. **Prepare Write Transactions**:
   - Select any write function from the list
   - Enter the function parameters
   - Click "Prepare Transaction" to generate the transaction data
   - Use the generated data with your Ethereum wallet to execute the transaction

## Custom RPC Configuration

You can configure custom RPC endpoints for each chain by setting environment variables in your `.env.local` file:

```
# Default endpoints
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-key
NEXT_PUBLIC_INFURA_API_KEY=your-infura-key

# Chain-specific endpoints
NEXT_PUBLIC_ETHEREUM_RPC_URL=https://your-custom-ethereum-rpc
NEXT_PUBLIC_POLYGON_RPC_URL=https://your-custom-polygon-rpc
```

The application will automatically use the most reliable RPC endpoint and fallback to others if needed.

## How WhatsABI Works

WhatsABI uses a combination of techniques to reconstruct ABIs for contracts that may not have published their source code:

1. **Bytecode Analysis**: Extracts function selectors from bytecode
2. **Signature Databases**: Matches function selectors with known signatures from:
   - 4byte.directory
   - OpenChain (formerly Samczsun's signature database)
3. **Verified Sources**: Checks verified contracts across:
   - Sourcify decentralized repository
   - Etherscan's verified contracts

This combination provides the best chance of reconstructing accurate ABIs for any contract.

## Architecture

This application is built with:

- **Next.js**: React framework for server-rendered applications
- **WhatsABI**: Core library for contract ABI detection and interaction
- **Viem**: Modern Ethereum library for TypeScript
- **TailwindCSS**: Utility-first CSS framework for styling

The codebase is organized as follows:

- `/app`: Next.js application code
  - `/components`: React components
  - `/lib`: Utility functions and WhatsABI implementation
    - `/lib/chainConfig.ts`: Multi-chain configuration and RPC management
    - `/lib/whatsabi.ts`: WhatsABI wrapper implementation
    - `/lib/whatsabiClient.ts`: Client for interacting with WhatsABI
  - `/api`: API routes for contract interactions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [WhatsABI](https://github.com/shazow/whatsabi) - The core library for contract ABI detection
- [shazow](https://github.com/shazow) - Creator of the WhatsABI library

TODOS:
- FIX README
- STABILIZE UNVERIFIED - PROXY CONTRACTS
- TEST CLI CONNECTION MORE