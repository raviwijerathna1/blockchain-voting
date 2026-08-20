// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    // ========== Structs ==========
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageUrl;
        uint256 voteCount;
        bool isActive;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 votedCandidateId;
        uint256 votedAt;
    }

    // ========== State Variables ==========
    address public owner;
    string public electionName;
    string public electionDescription;
    
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalVotes;
    uint256 public candidateCount;
    
    bool public isInitialized;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    
    // All voter addresses track කරන්න
    address[] public voterAddresses;

    // ========== Events ==========
    event ElectionCreated(
        string name, 
        uint256 startTime, 
        uint256 endTime
    );
    
    event CandidateAdded(
        uint256 indexed candidateId, 
        string name, 
        string party
    );
    
    event VoterRegistered(
        address indexed voter
    );
    
    event VoteCast(
        address indexed voter, 
        uint256 indexed candidateId,
        uint256 timestamp
    );
    
    event ElectionEnded(
        uint256 indexed winnerId, 
        string winnerName,
        uint256 totalVotes
    );

    // ========== Modifiers ==========
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier electionActive() {
        require(isInitialized, "Election not initialized");
        require(
            block.timestamp >= startTime, 
            "Election has not started yet"
        );
        require(
            block.timestamp <= endTime, 
            "Election has ended"
        );
        _;
    }

    modifier electionNotStarted() {
        require(
            !isInitialized || block.timestamp < startTime,
            "Election already started"
        );
        _;
    }

    // ========== Constructor ==========
    constructor() {
        owner = msg.sender;
    }

    // ========== Setup Functions ==========
    
    /**
     * @dev Election initialize කරන function
     */
    function initializeElection(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner {
        require(!isInitialized, "Election already initialized");
        require(
            _startTime > block.timestamp, 
            "Start time must be in future"
        );
        require(
            _endTime > _startTime, 
            "End time must be after start time"
        );

        electionName = _name;
        electionDescription = _description;
        startTime = _startTime;
        endTime = _endTime;
        isInitialized = true;

        emit ElectionCreated(_name, _startTime, _endTime);
    }

    /**
     * @dev Candidate add කරන function
     */
    function addCandidate(
        string memory _name,
        string memory _party,
        string memory _imageUrl
    ) external onlyOwner electionNotStarted {
        candidateCount++;
        
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            imageUrl: _imageUrl,
            voteCount: 0,
            isActive: true
        });

        emit CandidateAdded(candidateCount, _name, _party);
    }

    /**
     * @dev Candidate disable කරන function
     */
    function removeCandidate(uint256 _candidateId) 
        external 
        onlyOwner 
        electionNotStarted 
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        candidates[_candidateId].isActive = false;
    }

    // ========== Voter Functions ==========

    /**
     * @dev Voter register කරන function
     */
    function registerVoter(address _voter) 
        external 
        onlyOwner 
    {
        require(!voters[_voter].isRegistered, "Already registered");
        
        voters[_voter].isRegistered = true;
        voterAddresses.push(_voter);
        
        emit VoterRegistered(_voter);
    }

    /**
     * @dev Multiple voters register කරන function
     */
    function registerVotersBatch(address[] memory _voters) 
        external 
        onlyOwner 
    {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!voters[_voters[i]].isRegistered) {
                voters[_voters[i]].isRegistered = true;
                voterAddresses.push(_voters[i]);
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    /**
     * @dev Vote cast කරන function
     */
    function castVote(uint256 _candidateId) 
        external 
        electionActive 
    {
        require(
            voters[msg.sender].isRegistered, 
            "You are not registered to vote"
        );
        require(
            !voters[msg.sender].hasVoted, 
            "You have already voted"
        );
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        require(
            candidates[_candidateId].isActive,
            "Candidate is not active"
        );

        // Vote record කරන්න
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = _candidateId;
        voters[msg.sender].votedAt = block.timestamp;

        // Candidate vote count update කරන්න
        candidates[_candidateId].voteCount++;
        totalVotes++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    // ========== View Functions ==========

    /**
     * @dev Candidate details ගන්න
     */
    function getCandidate(uint256 _candidateId) 
        external 
        view 
        returns (Candidate memory) 
    {
        require(
            _candidateId > 0 && _candidateId <= candidateCount,
            "Invalid candidate ID"
        );
        return candidates[_candidateId];
    }

    /**
     * @dev සියලු candidates ගන්න
     */
    function getAllCandidates() 
        external 
        view 
        returns (Candidate[] memory) 
    {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            allCandidates[i - 1] = candidates[i];
        }
        return allCandidates;
    }

    /**
     * @dev Winner ගන්න (election ඉවර වූ පසු)
     */
    function getWinner() 
        external 
        view 
        returns (Candidate memory winner) 
    {
        require(
            block.timestamp > endTime, 
            "Election is still ongoing"
        );
        require(totalVotes > 0, "No votes cast");

        uint256 maxVotes = 0;
        uint256 winnerId = 0;

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].isActive && 
                candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }

        return candidates[winnerId];
    }

    /**
     * @dev Election status ගන්න
     */
    function getElectionStatus() 
        external 
        view 
        returns (
            string memory status,
            uint256 timeRemaining
        ) 
    {
        if (!isInitialized) {
            return ("Not Initialized", 0);
        } else if (block.timestamp < startTime) {
            return ("Upcoming", startTime - block.timestamp);
        } else if (block.timestamp <= endTime) {
            return ("Active", endTime - block.timestamp);
        } else {
            return ("Ended", 0);
        }
    }

    /**
     * @dev Voter info ගන්න
     */
    function getVoterInfo(address _voter) 
        external 
        view 
        returns (Voter memory) 
    {
        return voters[_voter];
    }

    /**
     * @dev Total registered voters ගන්න
     */
    function getTotalRegisteredVoters() 
        external 
        view 
        returns (uint256) 
    {
        return voterAddresses.length;
    }

    /**
     * @dev Election statistics ගන්න
     */
    function getElectionStats() 
        external 
        view 
        returns (
            uint256 _totalRegistered,
            uint256 _totalVotes,
            uint256 _candidateCount,
            uint256 _voterTurnout
        ) 
    {
        uint256 registered = voterAddresses.length;
        uint256 turnout = registered > 0 
            ? (totalVotes * 100) / registered 
            : 0;
            
        return (registered, totalVotes, candidateCount, turnout);
    }
}