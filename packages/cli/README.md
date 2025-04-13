# GetMeFcknABI CLI

<p align="center">
  <img src="https://getmefcknabi.fun/favicon.svg" alt="GetMeFcknABI Logo" width="150"/>
</p>

<p align="center">
  <b>✨ Extract ABIs from any smart contract with minimal hassle ✨</b>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/getmefcknabi.svg" alt="npm version">
  <img src="https://img.shields.io/npm/dm/getmefcknabi.svg" alt="downloads">
  <img src="https://img.shields.io/github/license/bezata/getmefcknabi.svg" alt="license">
</p>

<p align="center">
  A powerful CLI tool to fetch and save smart contract ABIs in seconds, supporting any EVM chain
</p>

---

## 🚀 Features

- 🎯 **Extract ABIs from any smart contract address**
- 🛡️ **Works with unverified contracts** by analyzing their bytecode
- 🔗 **Support for all major EVM chains** (Ethereum, Polygon, Arbitrum, Optimism, etc.)
- 🎨 **Interactive mode** with guided prompts
- 📝 **Multiple output formats** (JSON and TypeScript)
- 🧩 **Custom RPC support** for any chain
- 🎭 **Proxy contract resolution** to get the implementation ABI
- 💻 **Beautiful terminal UI** with colors and animations

## 📦 Installation

```bash
# Install globally
npm install -g getmefcknabi

# Or run directly with npx
npx getmefcknabi --interactive
```

## 🔧 Usage

### Interactive Mode (Recommended)

The easiest way to use GetMeFcknABI is in interactive mode:

```bash
getmefcknabi --interactive
```

This will guide you through a series of prompts to:
1. Enter a contract address
2. Select a blockchain network
3. Optionally provide a custom RPC URL
4. Choose an output format (JSON or TypeScript)
5. Specify a custom output filename (optional)

### Command Line Arguments

For scripting or quick use, you can provide all parameters directly:

```bash
getmefcknabi -a 0xContractAddress -c 1 -f json
```

#### Required Arguments:

- `-a, --address <address>` - Smart contract address
- `-c, --chainId <chainId>` - Chain ID (e.g., 1 for Ethereum Mainnet)
- `-f, --format <format>` - Output format: json or typescript

#### Optional Arguments:

- `-r, --rpcUrl <url>` - Custom RPC URL (will use default if not provided)
- `-o, --output <file>` - Output file path (defaults to `<address>.<extension>`)
- `-q, --quiet` - Suppress logs and only output the ABI
- `-i, --interactive` - Run in interactive mode
- `-h, --help` - Display help information
- `-V, --version` - Output the version number

### Examples

```bash
# Get ABI from Ethereum mainnet contract in JSON format
getmefcknabi -a 0xf08a50178dfcde18524640ea6618a1f965821715 -c 1 -f json

# Get ABI from Polygon using a custom RPC in TypeScript format with custom output path
getmefcknabi -a 0xf08a50178dfcde18524640ea6618a1f965821715 -c 137 -r https://polygon-rpc.com -f typescript -o ./contracts/MyContract.ts

# Run in interactive mode
getmefcknabi --interactive
```

## 🌐 Supported Chains

GetMeFcknABI supports all EVM-compatible chains, including:

- Ethereum Mainnet (1)
- Ethereum Sepolia (11155111)
- Polygon (137)
- Polygon Mumbai (80001)
- Arbitrum One (42161)
- Arbitrum Sepolia (421614)
- Optimism (10)
- Optimism Sepolia (11155420)
- Base (8453)
- Base Sepolia (84532)
- BNB Smart Chain (56)
- Avalanche C-Chain (43114)

And any other EVM chain when providing a custom RPC URL and chain ID!

## 🔍 How It Works

GetMeFcknABI uses a combination of techniques to extract the most complete ABI possible:

1. **Block Explorer APIs** - To get verified contract ABIs
2. **Bytecode Analysis** - For unverified contracts
3. **4byte Directory** - To resolve function signatures 
4. **Proxy Resolution** - To handle proxy contracts (EIP-1967, UUPS, etc.)

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/bezata">bezata</a>
</p>

<p align="center">
  <a href="https://getmefcknabi.fun">getmefcknabi.fun</a>
</p> 