/**
 * List of supported chains with public RPC URLs
 */
export const chains = [
    {
        id: 1,
        name: "Ethereum Mainnet",
        rpcUrl: "https://eth.llamarpc.com",
        blockExplorerUrl: "https://etherscan.io",
        isTestnet: false,
    },
    {
        id: 11155111,
        name: "Ethereum Sepolia",
        rpcUrl: "https://rpc.sepolia.org",
        blockExplorerUrl: "https://sepolia.etherscan.io",
        isTestnet: true,
    },
    {
        id: 137,
        name: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
        blockExplorerUrl: "https://polygonscan.com",
        isTestnet: false,
    },
    {
        id: 80001,
        name: "Polygon Mumbai",
        rpcUrl: "https://rpc-mumbai.maticvigil.com",
        blockExplorerUrl: "https://mumbai.polygonscan.com",
        isTestnet: true,
    },
    {
        id: 10,
        name: "Optimism",
        rpcUrl: "https://mainnet.optimism.io",
        blockExplorerUrl: "https://optimistic.etherscan.io",
        isTestnet: false,
    },
    {
        id: 11155420,
        name: "Optimism Sepolia",
        rpcUrl: "https://sepolia.optimism.io",
        blockExplorerUrl: "https://sepolia-optimistic.etherscan.io",
        isTestnet: true,
    },
    {
        id: 42161,
        name: "Arbitrum One",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        blockExplorerUrl: "https://arbiscan.io",
        isTestnet: false,
    },
    {
        id: 421614,
        name: "Arbitrum Sepolia",
        rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
        blockExplorerUrl: "https://sepolia.arbiscan.io",
        isTestnet: true,
    },
    {
        id: 56,
        name: "BNB Smart Chain",
        rpcUrl: "https://bsc-dataseed.binance.org",
        blockExplorerUrl: "https://bscscan.com",
        isTestnet: false,
    },
    {
        id: 8453,
        name: "Base",
        rpcUrl: "https://mainnet.base.org",
        blockExplorerUrl: "https://basescan.org",
        isTestnet: false,
    },
    {
        id: 84532,
        name: "Base Sepolia",
        rpcUrl: "https://sepolia.base.org",
        blockExplorerUrl: "https://sepolia.basescan.org",
        isTestnet: true,
    },
];
