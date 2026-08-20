import { ethers } from "ethers";

/**
 * Election data ගන්න
 */
export const getElectionData = async (contract) => {
  try {
    const [name, description, startTime, endTime, totalVotes] = 
      await Promise.all([
        contract.electionName(),
        contract.electionDescription(),
        contract.startTime(),
        contract.endTime(),
        contract.totalVotes(),
      ]);

    const [status, timeRemaining] = await contract.getElectionStatus();
    const stats = await contract.getElectionStats();

    return {
      name,
      description,
      startTime: Number(startTime) * 1000,
      endTime: Number(endTime) * 1000,
      totalVotes: Number(totalVotes),
      status,
      timeRemaining: Number(timeRemaining),
      totalRegistered: Number(stats[0]),
      voterTurnout: Number(stats[3]),
    };
  } catch (error) {
    console.error("Error fetching election data:", error);
    throw error;
  }
};

/**
 * සියලු candidates ගන්න
 */
export const getCandidates = async (contract) => {
  try {
    const candidates = await contract.getAllCandidates();
    
    return candidates.map((candidate) => ({
      id: Number(candidate.id),
      name: candidate.name,
      party: candidate.party,
      imageUrl: candidate.imageUrl,
      voteCount: Number(candidate.voteCount),
      isActive: candidate.isActive,
    }));
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

/**
 * Voter info ගන්න
 */
export const getVoterInfo = async (contract, address) => {
  try {
    const voter = await contract.getVoterInfo(address);
    
    return {
      isRegistered: voter.isRegistered,
      hasVoted: voter.hasVoted,
      votedCandidateId: Number(voter.votedCandidateId),
      votedAt: Number(voter.votedAt) * 1000,
    };
  } catch (error) {
    console.error("Error fetching voter info:", error);
    throw error;
  }
};

/**
 * Vote cast කරන function
 */
export const castVote = async (contract, candidateId) => {
  try {
    // Gas estimate කරන්න
    const gasEstimate = await contract.castVote.estimateGas(candidateId);
    
    // Transaction send කරන්න (10% buffer add කරන්න)
    const tx = await contract.castVote(candidateId, {
      gasLimit: (gasEstimate * BigInt(110)) / BigInt(100),
    });

    console.log("Transaction sent:", tx.hash);
    
    // Transaction confirm වෙනකල් wait කරන්න
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed:", receipt.hash);
    return receipt;
    
  } catch (error) {
    // Error messages user-friendly ලෙස handle කරන්න
    if (error.message.includes("You have already voted")) {
      throw new Error("ඔබ දැනටමත් ඡන්දය දී ඇත!");
    } else if (error.message.includes("You are not registered")) {
      throw new Error("ඔබ ඡන්ද හිමියකු ලෙස ලියාපදිංචි වී නොමැත!");
    } else if (error.message.includes("Election has not started")) {
      throw new Error("ඡන්දය තවම ආරම්භ වී නොමැත!");
    } else if (error.message.includes("Election has ended")) {
      throw new Error("ඡන්දය අවසන් වී ඇත!");
    }
    throw error;
  }
};

/**
 * Winner ගන්න
 */
export const getWinner = async (contract) => {
  try {
    const winner = await contract.getWinner();
    return {
      id: Number(winner.id),
      name: winner.name,
      party: winner.party,
      voteCount: Number(winner.voteCount),
    };
  } catch (error) {
    console.error("Error fetching winner:", error);
    throw error;
  }
};

/**
 * Events listen කරන function
 */
export const listenToEvents = (contract, callbacks) => {
  if (!contract) return;

  // Vote cast event
  contract.on("VoteCast", (voter, candidateId, timestamp) => {
    callbacks.onVoteCast?.({
      voter,
      candidateId: Number(candidateId),
      timestamp: Number(timestamp) * 1000,
    });
  });

  // Cleanup function
  return () => {
    contract.removeAllListeners();
  };
};

/**
 * Time format කරන helper
 */
export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [hours, minutes, secs]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
};

/**
 * Percentage calculate කරන helper
 */
export const calculatePercentage = (votes, total) => {
  if (total === 0) return 0;
  return ((votes / total) * 100).toFixed(1);
};