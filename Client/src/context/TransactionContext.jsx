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
  const readonlyProvider = new ethers.providers.JsonRpcProvider("https://rpc.sepolia.org");
  
  const getReadOnlyContract = () => {
      return new ethers.Contract(
          contractAddress,
          contractABI.abi ? contractABI.abi : contractABI,
          readonlyProvider
      );
  };

  const createEthereumContract = () => {
    if (!ethereum) return null;

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
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    setCurrentAccount(accounts[0]);
  };

  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      const contract = createEthereumContract();

      // 🔍 BLOCKCHAIN SYNC: Convert all to strings to match Transaction.sol requirement
      const tx = await contract.addToBlockchain(
        currentAccount,                   // receiver
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
      const realError = error.reason || (error.data && error.data.message) || error.message || "Transaction Failed";
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