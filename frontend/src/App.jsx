import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import CandidateCard from "./components/CandidateCard";
import Results from "./components/Results";
import { useWeb3 } from "./hooks/useWeb3";
import {
  getElectionData,
  getCandidates,
  getVoterInfo,
  castVote,
  getWinner,
  listenToEvents,
  formatTimeRemaining,
} from "./utils/contract";
import "./styles/App.css";

const App = () => {
  // Web3 state
  const {
    contract,
    account,
    isConnected,
    isConnecting,
    error: web3Error,
    connectWallet,
    disconnectWallet,
    formatAddress,
  } = useWeb3();

  // App state
  const [electionData, setElectionData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [winner, setWinner] = useState(null);
  const [electionStats, setElectionStats] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState("vote");

  // Notification show කරන helper
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Data load කරන function
  const loadData = useCallback(async () => {
    if (!contract) return;
    
    setIsLoading(true);
    try {
      const [election, candidateList, stats] = await Promise.all([
        getElectionData(contract),
        getCandidates(contract),
        contract.getElectionStats(),
      ]);

      setElectionData(election);
      setCandidates(candidateList);
      setTimeRemaining(election.timeRemaining);
      setElectionStats({
        totalRegistered: Number(stats[0]),
        totalVotes: Number(stats[1]),
        candidateCount: Number(stats[2]),
        voterTurnout: Number(stats[3]),
      });

      // Election ended නම් winner ගන්න
      if (election.status === "Ended" && election.totalVotes > 0) {
        try {
          const win = await getWinner(contract);
          setWinner(win);
        } catch (e) {
          console.log("Could not get winner:", e);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showNotification("Data load කිරීමේ දෝෂයක් ඇත!", "error");
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Voter info load කරන function
  const loadVoterInfo = useCallback(async () => {
    if (!contract || !account) return;
    
    try {
      const info = await getVoterInfo(contract, account);
      setVoterInfo(info);
    } catch (error) {
      console.error("Error loading voter info:", error);
    }
  }, [contract, account]);

  // Contract load වූ විට data load කරන්න
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Account change වූ විට voter info load කරන්න
  useEffect(() => {
    loadVoterInfo();
  }, [loadVoterInfo]);

  // Real-time countdown timer
  useEffect(() => {
    if (!electionData || electionData.status !== "Active") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          loadData(); // Reload when time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [electionData?.status, loadData]);

  // Event listeners setup කරන්න
  useEffect(() => {
    if (!contract) return;

    const cleanup = listenToEvents(contract, {
      onVoteCast: ({ voter, candidateId }) => {
        // Candidates update කරන්න
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId
              ? { ...c, voteCount: c.voteCount + 1 }
              : c
          )
        );
        
        if (voter.toLowerCase() !== account?.toLowerCase()) {
          showNotification(
            `නව ඡන්දයක් Candidate #${candidateId} ට ලැබුණි!`, 
            "info"
          );
        }
      },
    });

    return cleanup;
  }, [contract, account]);

  // Vote cast කරන function
  const handleVote = async (candidateId) => {
    if (!contract || !account) {
      showNotification("MetaMask connect කරන්න!", "error");
      return;
    }

    if (!voterInfo?.isRegistered) {
      showNotification("ඔබ ලියාපදිංචි ඡන්ද හිමියෙකු නොවේ!", "error");
      return;
    }

    // Confirm dialog
    const candidate = candidates.find(c => c.id === candidateId);
    const confirmed = window.confirm(
      `${candidate?.name} ට ඡන්දය දෙන්නද? මෙය undo කළ නොහැක!`
    );
    if (!confirmed) return;

    setIsVoting(true);
    try {
      await castVote(contract, candidateId);
      
      showNotification("🎉 ඡන්දය සාර්ථකව ලබා දෙන ලදි!");
      
      // Data refresh කරන්න
      await Promise.all([loadData(), loadVoterInfo()]);
      
    } catch (error) {
      showNotification(error.message || "ඡන්දය දීමේ දෝෂයක් ඇත!", "error");
    } finally {
      setIsVoting(false);
    }
  };

  // Render
  return (
    <div className="app">
      {/* Header */}
      <Header
        account={account}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        formatAddress={formatAddress}
        electionName={electionData?.name}
      />

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
          <button onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      <main className="main-content">
        {/* Connect prompt */}
        {!isConnected && (
          <div className="connect-prompt">
            <div className="connect-icon">🦊</div>
            <h2>MetaMask Connect කරන්න</h2>
            <p>ඡන්දය දීමට ඔබේ MetaMask wallet connect කරන්න</p>
            <button
              className="btn btn-primary btn-large"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
            {web3Error && (
              <p className="error-text">{web3Error}</p>
            )}
          </div>
        )}

        {/* Loading */}
        {isConnected && isLoading && (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading election data...</p>
          </div>
        )}

        {/* Election content */}
        {isConnected && !isLoading && electionData && (
          <>
            {/* Election info banner */}
            <div className={`election-banner status-${electionData.status.toLowerCase()}`}>
              <div className="banner-left">
                <h2>{electionData.name}</h2>
                <p>{electionData.description}</p>
              </div>
              <div className="banner-right">
                <div className="status-badge">
                  {electionData.status === "Active" && "🟢 Active"}
                  {electionData.status === "Upcoming" && "🟡 Upcoming"}
                  {electionData.status === "Ended" && "🔴 Ended"}
                </div>
                {electionData.status === "Active" && (
                  <div className="countdown">
                    ⏱️ {formatTimeRemaining(timeRemaining)}
                  </div>
                )}
              </div>
            </div>

            {/* Voter status */}
            {voterInfo && (
              <div className={`voter-status ${
                voterInfo.hasVoted 
                  ? "status-voted" 
                  : voterInfo.isRegistered 
                  ? "status-registered" 
                  : "status-not-registered"
              }`}>
                {voterInfo.hasVoted && (
                  <span>✅ ඔබ Candidate #{voterInfo.votedCandidateId} ට ඡන්දය දී ඇත</span>
                )}
                {!voterInfo.hasVoted && voterInfo.isRegistered && (
                  <span>📋 ඔබ ලියාපදිංචි ඡන්ද හිමියෙකි - ඡන්දය දෙන්න!</span>
                )}
                {!voterInfo.isRegistered && (
                  <span>❌ ඔබ ලියාපදිංචි ඡන්ද හිමියෙකු නොවේ</span>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === "vote" ? "active" : ""}`}
                onClick={() => setActiveTab("vote")}
              >
                🗳️ Vote
              </button>
              <button
                className={`tab ${activeTab === "results" ? "active" : ""}`}
                onClick={() => setActiveTab("results")}
              >
                📊 Results
              </button>
            </div>

            {/* Vote tab */}
            {activeTab === "vote" && (
              <div className="candidates-grid">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    totalVotes={electionData.totalVotes}
                    hasVoted={voterInfo?.hasVoted || false}
                    votedCandidateId={voterInfo?.votedCandidateId || 0}
                    isElectionActive={electionData.status === "Active"}
                    onVote={handleVote}
                    isVoting={isVoting}
                  />
                ))}
              </div>
            )}

            {/* Results tab */}
            {activeTab === "results" && (
              <Results
                candidates={candidates}
                totalVotes={electionData.totalVotes}
                winner={winner}
                electionStats={electionStats}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;