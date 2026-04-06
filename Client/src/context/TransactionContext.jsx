import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  // 🏎️ DUAL-ENGINE BRIDGE: Separate 'Reading' from 'Writing' to bypass rate limits
  // Changed from rpc.sepolia.org to a much stronger public node
  const readonlyProvider = new ethers.providers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  
  const getReadOnlyContract = () => {
      return new ethers.Contract(
          contractAddress,
          contractABI.abi ? contractABI.abi : contractABI,
          readonlyProvider
      );
  };

  const createEthereumContract = async () => {
    if (!ethereum) throw new Error("MetaMask not installed");
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(
      contractAddress,
      contractABI.abi ? contractABI.abi : contractABI,
      signer
    );
  };

  const connectWallet = async () => {
    if (!ethereum) return alert("Install MetaMask");
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
    return accounts[0];
  };

  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      // 🛡️ DYNAMIC AUTHORIZATION: Prevent undefined account errors from page reloads
      let activeAccount = currentAccount;
      if (!activeAccount) {
        activeAccount = await connectWallet();
      }

      const contract = await createEthereumContract();

      // 🔍 BLOCKCHAIN SYNC: Convert all to strings to match Transaction.sol requirement
      const tx = await contract.addToBlockchain(
        activeAccount,                    // receiver
        user_id.toString(),               // voter identity
        election_id.toString(),           // election UUID
        candidate_id.toString(),          // candidate selected
        { gasLimit: 500000 }              // 🏗️ SAFETY: High gas limit for cloud stability
      );

      console.log(`Transaction Loading... Hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Transaction Success!`);

      // ✅ REFRESH AFTER TX
      await getAllTransactions();

      return { success: true, hash: tx.hash, mess: "Vote Casted Successfully" };
    } catch (error) {
      console.error("BLOCKCHAIN REVERT ERROR:", error);
      let realError = error.reason || (error.data && error.data.message) || error.message || "Transaction Failed";
      
      // We only want to intercept genuine rate limit exceptions (-32002),
      // otherwise, we want to see the real reason the Smart Contract reverted!
      if (error.code === -32002) {
         realError = "🚨 PENDING METAMASK TRANSACTION 🚨\n\nYou clicked Vote, but MetaMask is hiding in the background!\n\n1. Click the MetaMask Fox Icon in your browser extension bar.\n2. You will see a transaction waiting for you to 'Confirm'.\n3. Confirm it, or reject it and try again.";
      }
      
      return { success: false, mess: realError };
    }
  };

  const [isNetworkBusy, setIsNetworkBusy] = useState(false);

  // 🤫 SILENT LISTENER: Uses the Public Bridge
  const getAllTransactions = useCallback(async () => {
    if (isNetworkBusy) return [];
    
    try {
      const contract = getReadOnlyContract();
      const data = await contract.getAllTransaction();
      const formatted = data.map((tx) => ({
        election_id: tx.election_id.toString(),
        candidate_id: tx.candidate_id.toString(),
        user_id: tx.user_id.toString(),
      }));

      setTransactions(formatted);
      return formatted;
    } catch (error) {
      // 🛡️ SILENT SHIELD: Never alert the user for background sync errors
      if (error.message.includes("too many errors") || error.code === 429) {
        setIsNetworkBusy(true);
        setTimeout(() => setIsNetworkBusy(false), 20000);
      }
      return [];
    }
  }, [isNetworkBusy]);

  const getElectionTimes = async () => {
    try {
      const contract = getReadOnlyContract();
      const start = await contract.startTime();
      const end = await contract.endTime();
      return { start: start.toNumber(), end: end.toNumber() };
    } catch (error) {
      console.warn("🛡️ SILENT NOTICE: Failed to fetch election times. Using defaults.");
      return { start: 0, end: 0 };
    }
  };

  const setElectionTimes = async (startTimeUnix, endTimeUnix) => {
    try {
      if (!ethereum) return;
      const transactionsContract = createEthereumContract();
      const transactionHash = await transactionsContract.setElectionPeriod(startTimeUnix, endTimeUnix);
      await transactionHash.wait();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  useEffect(() => {
    // 🤫 FOCUS MODE: Only fetch on-demand to save RPC credits
    // getAllTransactions(); 
  }, [currentAccount, ethereum]); 

  // 🤫 BACKGROUND SPAM REMOVED - Final Silence 🛡️

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        sendTransaction,
        getAllTransactions,
        getElectionTimes,
        setElectionTimes,
        transactions,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};