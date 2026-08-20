import React from "react";
import { calculatePercentage } from "../utils/contract";

const CandidateCard = ({ 
  candidate, 
  totalVotes, 
  hasVoted,
  votedCandidateId,
  isElectionActive,
  onVote,
  isVoting 
}) => {
  const percentage = calculatePercentage(candidate.voteCount, totalVotes);
  const isVotedFor = votedCandidateId === candidate.id;
  const isWinning = candidate.voteCount === Math.max(
    candidate.voteCount, 
    0
  );

  return (
    <div className={`candidate-card ${isVotedFor ? "voted" : ""} 
      ${!candidate.isActive ? "inactive" : ""}`}
    >
      {/* Voted badge */}
      {isVotedFor && (
        <div className="voted-badge">✅ ඔබේ ඡන්දය</div>
      )}

      {/* Candidate image */}
      <div className="candidate-image-container">
        <img
          src={candidate.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`}
          alt={candidate.name}
          className="candidate-image"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`;
          }}
        />
      </div>

      {/* Candidate info */}
      <div className="candidate-info">
        <h3 className="candidate-name">{candidate.name}</h3>
        <span className="candidate-party">🏛️ {candidate.party}</span>
        
        {/* Vote count */}
        <div className="vote-stats">
          <span className="vote-count">
            🗳️ {candidate.voteCount} votes
          </span>
          <span className="vote-percentage">{percentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Vote button */}
      {isElectionActive && !hasVoted && candidate.isActive && (
        <button
          className="btn btn-vote"
          onClick={() => onVote(candidate.id)}
          disabled={isVoting}
        >
          {isVoting ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            "Vote Now 🗳️"
          )}
        </button>
      )}

      {!candidate.isActive && (
        <div className="candidate-inactive-label">
          ❌ Disqualified
        </div>
      )}
    </div>
  );
};

export default CandidateCard;