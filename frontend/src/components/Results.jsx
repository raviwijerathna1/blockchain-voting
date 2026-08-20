import React from "react";
import { calculatePercentage } from "../utils/contract";

const Results = ({ candidates, totalVotes, winner, electionStats }) => {
  // Votes by order sort කරන්න
  const sortedCandidates = [...candidates]
    .filter(c => c.isActive)
    .sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="results-container">
      {/* Winner announcement */}
      {winner && (
        <div className="winner-announcement">
          <div className="winner-trophy">🏆</div>
          <h2>Winner!</h2>
          <h3>{winner.name}</h3>
          <p>{winner.party}</p>
          <div className="winner-votes">
            {winner.voteCount} votes ({calculatePercentage(winner.voteCount, totalVotes)}%)
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{electionStats?.totalRegistered || 0}</div>
          <div className="stat-label">Registered Voters</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🗳️</div>
          <div className="stat-value">{totalVotes}</div>
          <div className="stat-label">Total Votes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">
            {electionStats?.voterTurnout || 0}%
          </div>
          <div className="stat-label">Voter Turnout</div>
        </div>
      </div>

      {/* Results table */}
      <div className="results-table">
        <h3>📊 Detailed Results</h3>
        {sortedCandidates.map((candidate, index) => (
          <div key={candidate.id} className="result-row">
            <div className="result-rank">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
            </div>
            <div className="result-info">
              <span className="result-name">{candidate.name}</span>
              <span className="result-party">{candidate.party}</span>
            </div>
            <div className="result-bar-container">
              <div
                className="result-bar"
                style={{
                  width: `${calculatePercentage(
                    candidate.voteCount,
                    totalVotes
                  )}%`,
                  background: index === 0 
                    ? "#f59e0b" 
                    : index === 1 
                    ? "#6b7280" 
                    : "#cd7c2f",
                }}
              ></div>
            </div>
            <div className="result-votes">
              <strong>{candidate.voteCount}</strong>
              <span>({calculatePercentage(candidate.voteCount, totalVotes)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;