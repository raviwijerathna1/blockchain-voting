import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import VotingABI from "../artifacts/Voting.json";
import contractConfig from "../config/contract.json";

const CONTRACT_ADDRESS = contractConfig.contractAddress;

export const useWeb3 = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // MetaMask connect කරන function
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found! Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Accounts request කරන්න
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      // Contract instance හදන්න
      const votingContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        VotingABI.abi,
        web3Signer
      );

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(votingContract);
      setAccount(accounts[0]);
      setChainId(network.chainId.toString());

      // localStorage save කරන්න
      localStorage.setItem("walletConnected", "true");

    } catch (err) {
      setError(err.message || "Failed to connect wallet");
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Wallet disconnect කරන function
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setChainId(null);
    localStorage.removeItem("walletConnected");
  }, []);

  // Auto connect
  useEffect(() => {
    const autoConnect = async () => {
      if (
        window.ethereum && 
        localStorage.getItem("walletConnected") === "true"
      ) {
        await connectWallet();
      }
    };
    autoConnect();
  }, [connectWallet]);

  // Account change handle කරන්න
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged", 
        handleAccountsChanged
      );
      window.ethereum.removeListener(
        "chainChanged", 
        handleChainChanged
      );
    };
  }, [connectWallet, disconnectWallet]);

  // Address format කරන helper function
  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    provider,
    signer,
    contract,
    account,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isConnected: !!account,
  };
};