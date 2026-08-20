import React from "react";

const Header = ({ 
  account, 
  isConnected, 
  isConnecting, 
  onConnect, 
  onDisconnect,
  formatAddress,
  electionName 
}) => {
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <span className="logo-icon">🗳️</span>
          <div className="logo-text">
            <h1>BlockVote</h1>
            <span className="logo-subtitle">Decentralized Voting</span>
          </div>
        </div>

        {/* Election name */}
        {electionName && (
          <div className="election-title">
            <span>{electionName}</span>
          </div>
        )}

        {/* Wallet connect */}
        <div className="header-wallet">
          {isConnected ? (
            <div className="wallet-info">
              <div className="wallet-address">
                <div className="wallet-dot"></div>
                <span>{formatAddress(account)}</span>
              </div>
              <button 
                className="btn btn-outline btn-sm"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <span className="spinner"></span>
                  Connecting...
                </>
              ) : (
                <>
                  🦊 Connect MetaMask
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;