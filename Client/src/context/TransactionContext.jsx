import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);


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
      // Params: (address receiver, string user_id, string election_id, string candidate_id)
      const tx = await contract.addToBlockchain(
        currentAccount,                   // receiver (voter's own address)
        user_id.toString(),               // voter identity tracking
        election_id.toString(),           // the current election UUID
        candidate_id.toString(),          // the selected candidate
        {
          gasLimit: 300000,               // 🏗️ SAFETY: Ensure enough gas for the tx
        }
      );

      console.log(`Transaction Loading... Hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Transaction Success!`);

      // ✅ FORCE REFRESH AFTER TX
      await getAllTransactions();

      return { success: true, hash: tx.hash, mess: "Vote Casted Successfully" };
    } catch (error) {
      console.error("BLOCKCHAIN REVERT ERROR:", error);
      
      // 🕵️‍♂️ EXTRACT REAL ERROR: MetaMask usually hides the real reason in 'reason' or 'data.message'
      const realError = error.reason || (error.data && error.data.message) || error.message || "Transaction Failed";
      return { success: false, mess: realError };
    }
  };

  // ✅ FIXED DATA FETCH (IMPORTANT CHANGE)
  const getAllTransactions = useCallback(async () => {
    try {
      const contract = createEthereumContract();
      if (!contract) return [];

      // 🔥 SAFETY CHECK: Verify the contract exists before calling
      const code = await ethereum.request({
        method: 'eth_getCode',
        params: [contractAddress, 'latest'],
      });
      if (code === '0x') {
        console.warn("⚠️ BLOCKCHAIN: Contract not found at this address on Sepolia. Skipping transactions.");
        return [];
      }

      const data = await contract.getAllTransaction();
      console.log("RAW BLOCKCHAIN DATA:", data);

      const formatted = data.map((tx) => ({
        election_id: tx.election_id.toString(),
        candidate_id: tx.candidate_id.toString(),
        user_id: tx.user_id.toString(),
      }));

      setTransactions(formatted);
      return formatted;
    } catch (error) {
      // 🛡️ SILENCE REVERT ERRORS (Common with Alchemy free tier)
      if (error.code === 'CALL_EXCEPTION' || error.message.includes('missing revert data')) {
        console.warn("🛡️ BLOCKCHAIN NOTICE: Sepolia RPC is currently busy or contract not yet initialized. Skipping fetch.");
      } else {
        console.error("Blockchain Fetch Error:", error);
      }
      return [];
    }
  }, []);

  const getElectionTimes = async () => {
    try {
      const contract = createEthereumContract();
      const start = await contract.startTime();
      const end = await contract.endTime();
      return { start: start.toNumber(), end: end.toNumber() };
    } catch (error) {
      console.error(error);
      return { start: 0, end: 0 };
    }
  };

  const setElectionTimes = async (startTimeUnix, endTimeUnix) => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");
      const transactionsContract = createEthereumContract();
      const transactionHash = await transactionsContract.setElectionPeriod(startTimeUnix, endTimeUnix);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  useEffect(() => {
    if (ethereum) {
      getAllTransactions();
    }
  }, [currentAccount, getAllTransactions]);

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