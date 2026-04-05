import abi from "./Transaction.json";

export const contractABI = abi.abi;

export const contractAddress = "0xe0678A17cEc2d5346a8AD5EE6e3f990Faa0a0AD4"; // Updated contract address after migration to Sepolia.
export const adminAddress = "0x1917D6eD52515E0870CA2beBb81F38A2150128a8";
// This variable stores the address of the deployed smart contract. If you have deployed your own contract, replace the empty string with the address of your contract.

// If you can't find the `contractAddress` in the compiled `Transaction.json` file,
// you can manually locate the address by finding the appropriate piece of code in the file.
// The address should be located under the `"networks"` object, which lists the deployed addresses for different networks.
// For example, if you are using the default Ganache network, the `"networks"` object will contain an entry for network ID `5777`.
// Find the `"address"` field under this entry, and copy the address value into the `contractAddress` variable.