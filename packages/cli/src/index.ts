#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { isAddress } from "viem";
import inquirer from "inquirer";
import boxen from "boxen";
import gradient from "gradient-string";
import figlet from "figlet";

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");

// Define types for API response
interface APIResponse {
  abi: any[];
  formattedABI: string;
  address: string;
}

// Define CLI options type
interface CLIOptions {
  interactive?: boolean;
  address?: string;
  chainId?: string;
  rpcUrl?: string;
  format?: string;
  output?: string;
  quiet?: boolean;
}

// Define available chains
const CHAINS = [
  { id: 1, name: "Ethereum Mainnet" },
  { id: 11155111, name: "Ethereum Sepolia" },
  { id: 137, name: "Polygon" },
  { id: 80001, name: "Polygon Mumbai" },
  { id: 42161, name: "Arbitrum One" },
  { id: 421614, name: "Arbitrum Sepolia" },
  { id: 10, name: "Optimism" },
  { id: 11155420, name: "Optimism Sepolia" },
  { id: 8453, name: "Base" },
  { id: 84532, name: "Base Sepolia" },
  { id: 56, name: "BNB Smart Chain" },
  { id: 43114, name: "Avalanche C-Chain" },
];

// Set up the CLI program
const program = new Command();

// Display cool banner
function displayBanner(): string {
  const banner =
    "\n" +
    gradient.pastel.multiline(
      figlet.textSync("getmefcknabi", {
        font: "ANSI Shadow",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      })
    ) +
    "\n" +
    boxen(
      chalk.bold("🔍 Extract ABI from any smart contract with minimal hassle"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        backgroundColor: "#222",
      }
    );

  return banner;
}

// Log the banner to console
function logBanner(): void {
  console.log(displayBanner());
  console.log("\n");
}

program
  .name("getmefcknabi")
  .description(
    "CLI tool to extract ABIs from any smart contract with minimal hassle"
  )
  .version("0.1.0")
  .option("-i, --interactive", "Run in interactive mode")
  .option("-a, --address <address>", "Smart contract address")
  .option("-c, --chainId <chainId>", "Chain ID (e.g., 1 for Ethereum Mainnet)")
  .option("-f, --format <format>", "Output format: json or typescript")
  .option(
    "-r, --rpcUrl <url>",
    "RPC URL (optional, will use default if not provided)"
  )
  .option(
    "-o, --output <file>",
    "Output file (optional, defaults to <address>.<extension>)"
  )
  .option("-q, --quiet", "Suppress logs and only output the ABI")
  .addHelpText("before", () => {
    return displayBanner();
  })
  .addHelpText("after", () => {
    return `
Examples:
  $ getmefcknabi -a 0xf08a50178dfcde18524640ea6618a1f965821715 -c 1 -f json
  $ getmefcknabi -a 0xf08a50178dfcde18524640ea6618a1f965821715 -c 11155111 -r https://rpc.sepolia.org -f typescript
  $ getmefcknabi --interactive

Chain IDs:
  ${CHAINS.map((chain) => `${chain.id} - ${chain.name}`).join("\n  ")}
    `;
  })
  .parse(process.argv);

const options = program.opts<CLIOptions>();

async function runInteractiveMode() {
  logBanner();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "address",
      message: "Enter smart contract address:",
      validate: (input) =>
        isAddress(input) ? true : "Please enter a valid Ethereum address",
    },
    {
      type: "list",
      name: "chainId",
      message: "Select blockchain network:",
      choices: CHAINS.map((chain) => ({
        name: chain.name,
        value: chain.id.toString(),
      })),
    },
    {
      type: "confirm",
      name: "useCustomRpc",
      message: "Do you want to use a custom RPC URL?",
      default: false,
    },
    {
      type: "input",
      name: "rpcUrl",
      message: "Enter your RPC URL:",
      when: (answers) => answers.useCustomRpc,
      validate: (input) =>
        input.startsWith("http") ? true : "Please enter a valid HTTP URL",
    },
    {
      type: "list",
      name: "format",
      message: "Select output format:",
      choices: [
        { name: "JSON", value: "json" },
        { name: "TypeScript", value: "typescript" },
      ],
    },
    {
      type: "input",
      name: "output",
      message: "Enter output filename (leave empty for default):",
    },
  ]);

  // Apply answers to options
  options.address = answers.address;
  options.chainId = answers.chainId;
  options.rpcUrl = answers.rpcUrl;
  options.format = answers.format;
  if (answers.output) options.output = answers.output;

  return extractABI();
}

async function extractABI() {
  const spinner = ora("Initializing").start();

  try {
    // Validate required options
    if (!options.address) {
      spinner.fail(chalk.red("Error: Contract address is required"));
      console.log(
        chalk.yellow("Try running with --interactive or specify --address")
      );
      process.exit(1);
    }

    if (!options.chainId) {
      spinner.fail(chalk.red("Error: Chain ID is required"));
      console.log(
        chalk.yellow("Try running with --interactive or specify --chainId")
      );
      process.exit(1);
    }

    if (!options.format) {
      spinner.info(chalk.yellow("No format specified, defaulting to JSON"));
      options.format = "json";
    }

    // Validate address
    if (!isAddress(options.address)) {
      spinner.fail(chalk.red("Invalid Ethereum address format"));
      process.exit(1);
    }

    const chainId = parseInt(options.chainId);
    const outputFormat = options.format.toLowerCase();

    if (outputFormat !== "json" && outputFormat !== "typescript") {
      spinner.fail(
        chalk.red('Invalid output format. Use "json" or "typescript"')
      );
      process.exit(1);
    }

    // Find chain name for display
    const chainInfo = CHAINS.find((chain) => chain.id === chainId);
    const chainName = chainInfo ? chainInfo.name : `Chain ID ${chainId}`;

    if (!options.quiet) {
      spinner.text = `Connecting to ${chalk.cyan(chainName)}...`;
    }

    try {
      // Build API URL with required parameters
      let apiUrl = `https://getmefcknabi.fun/api/contract/abi?address=${options.address}&chainId=${chainId}`;

      // Add RPC URL if provided
      if (options.rpcUrl) {
        apiUrl += `&rpcUrl=${encodeURIComponent(options.rpcUrl)}`;
      }

      if (!options.quiet) {
        spinner.text = chalk.yellow(
          `Extracting ABI for ${chalk.cyan(options.address)} on ${chalk.green(
            chainName
          )}...`
        );
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}\nResponse: ${errorText}`
        );
      }

      const data = (await response.json()) as APIResponse;

      if (!data || !data.abi) {
        throw new Error("Invalid API response format");
      }

      const successMessage = `Successfully retrieved ABI for ${chalk.cyan(
        options.address
      )} on ${chalk.green(chainName)}! 🎉`;
      spinner.succeed(chalk.bold.green(successMessage));

      // Format and output the result
      let formattedOutput: string;
      let defaultFileName: string;

      if (outputFormat === "json") {
        formattedOutput = JSON.stringify(data.abi, null, 2);
        defaultFileName = `${options.address.toLowerCase()}.json`;
      } else {
        const contractName = `Contract${options.address
          .substring(0, 6)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")}`;
        formattedOutput =
          `// ABI for contract at ${options.address}\n` +
          `export const ${contractName}ABI = ${JSON.stringify(
            data.abi,
            null,
            2
          )} as const;\n\n` +
          `// Use with your favorite library\n` +
          `// Example with viem:\n` +
          `// import { createPublicClient, http } from 'viem';\n` +
          `// const client = createPublicClient({ chain, transport: http() });\n` +
          `// const contract = getContract({\n` +
          `//   address: '${options.address}',\n` +
          `//   abi: ${contractName}ABI,\n` +
          `//   publicClient: client,\n` +
          `// });\n`;
        defaultFileName = `${options.address.toLowerCase()}.ts`;
      }

      // Always save to project root
      const outputPath = options.output
        ? path.resolve(projectRoot, options.output)
        : path.resolve(projectRoot, defaultFileName);

      // Ensure the directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Write to file
      await fs.writeFile(outputPath, formattedOutput);

      if (!options.quiet) {
        console.log(
          boxen(
            chalk.bold(
              `📝 ABI saved to: ${chalk.green(
                path.relative(process.cwd(), outputPath)
              )}`
            ),
            {
              padding: 1,
              margin: 1,
              borderStyle: "round",
              borderColor: "green",
              backgroundColor: "#222",
            }
          )
        );

        console.log(chalk.cyan("\n📄 Preview:"));
        // Only show first few lines in preview
        const preview =
          formattedOutput.split("\n").slice(0, 10).join("\n") +
          (formattedOutput.split("\n").length > 10 ? "\n..." : "");
        console.log(preview);

        // Add a final success message
        console.log(
          chalk.bold.green(`\n✨ Success! ABI extracted and saved to file.`)
        );
        console.log(chalk.grey("\nThank you for using getmefcknabi! 🚀\n"));
      }
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      if (!options.quiet) {
        console.error(error);
      }
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(
      chalk.red(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    if (!options.quiet) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Main function
async function main() {
  if (options.interactive) {
    await runInteractiveMode();
  } else {
    await extractABI();
  }
}

main();
