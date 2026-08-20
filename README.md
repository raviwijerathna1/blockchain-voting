```markdown name=README.md url=https://github.com/raviwijerathna1/blockchain-voting/blob/main/README.md
# Blockchain Voting

A simple decentralized voting system implemented with an Ethereum smart contract (Hardhat) and a React + Vite frontend. It provides owner-controlled election setup, candidate management, voter registration, secure vote casting, and on-chain vote counting — intended as a demonstration / prototype for building blockchain-based elections.

## Key features
- Owner-initialized elections with start/end times
- Add / remove candidates before an election starts
- Register single or batch voters
- Cast votes (one vote per registered address)
- Query election status, candidate list, voter info and statistics
- Frontend UI to connect MetaMask, view candidates, cast votes, and view results

## Stack
- Language(s): Solidity (contracts), JavaScript (frontend & scripts)
- Framework / runtime:
  - Hardhat for contract development, compilation, testing and deployment
  - React + Vite for the frontend
- Notable libraries:
  - ethers (frontend interaction with contract)
  - Hardhat toolbox (testing & scripts)
  - dotenv (for environment variables)

## Project layout
```
contracts/                 Solidity smart contract(s)
  └─ Voting.sol            Main election contract (owner, candidates, voters, voting logic)

frontend/
  src/                     React + Vite frontend source
    ├─ App.jsx             Main app (loads election data, handles vote flow)
    ├─ components/         UI components (CandidateCard, Header, Results)
    ├─ hooks/              web3 hook (useWeb3)
    ├─ utils/              contract helpers (getElectionData, castVote, listenToEvents, etc.)
    └─ styles/             CSS for app

scripts/                   Hardhat deployment scripts (scripts/deploy.js)
package.json               Root npm scripts (hardhat commands)
frontend/src/package.json  Frontend npm scripts (vite dev/build)
.env                      Example environment variables for deployments
```

How it fits together:
- Hardhat compiles and deploys the `Voting.sol` contract and exposes scripts to run a local node or deploy to Sepolia.
- The React frontend connects to MetaMask and uses ethers to call contract functions exposed by `Voting.sol`. Real-time updates are handled by listening to contract events (e.g., VoteCast).

## Quickstart — local development

Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MetaMask (for frontend testing)
- (Optional) An Ethereum provider / RPC (for Sepolia deploy)

1) Clone and install
```bash
git clone https://github.com/raviwijerathna1/blockchain-voting.git
cd blockchain-voting
npm install
```

2) Compile contracts
```bash
npm run compile
```

3) Run a local Hardhat node
```bash
npm run node
```
This starts a local JSON-RPC node you can use for deploying and testing.

4) Deploy contracts to local network
```bash
npm run deploy:local
```
This runs `scripts/deploy.js` against the `localhost` network.

5) Run tests
```bash
npm run test
```

## Deploy to Sepolia (testnet)
Set environment variables in `.env` (example provided in repo):
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
ETHERSCAN_API_KEY=your_etherscan_key
```
Then run:
```bash
npm run deploy:sepolia
```
Make sure your PRIVATE_KEY has ETH on Sepolia to pay gas.

## Frontend — run locally
The frontend lives in frontend/src and uses Vite.

1) Install frontend deps and start dev server:
```bash
cd frontend/src
npm install
npm run dev
```

2) Open the displayed local URL (e.g., http://localhost:5173) and connect MetaMask to the same network where the contract is deployed (local Hardhat node or Sepolia).

Notes:
- The frontend uses helper functions in `frontend/src/utils/contract` to load election metadata (getElectionData, getCandidates, getElectionStats), cast votes (castVote), and listen to events (listenToEvents).
- The React hook `useWeb3` handles wallet connection, account state and provides the instantiated contract.

## Contract overview (contracts/Voting.sol)
Important public functions and behavior:
- initializeElection(name, description, startTime, endTime) — owner only; initializes election metadata and times
- addCandidate(name, party, imageUrl) — owner only; can only be called before election starts
- removeCandidate(candidateId) — owner only; disables a candidate before the election starts
- registerVoter(address) — owner only; register single voter
- registerVotersBatch(address[]) — owner only; register multiple voters
- castVote(candidateId) — registered voters only; can only vote while election is active; increments candidate voteCount and totalVotes
- getCandidate / getAllCandidates — view candidate data
- getWinner — returns candidate with highest votes after election end
- getElectionStatus / getElectionStats — helper view functions for frontend usage
Events:
- ElectionCreated, CandidateAdded, VoterRegistered, VoteCast, ElectionEnded

Refer to contracts/Voting.sol for full source and inline comments.

## Environment variables
- PRIVATE_KEY: deployer account private key (used by Hardhat for deployments)
- SEPOLIA_RPC_URL: Sepolia RPC endpoint (Infura/Alchemy or other)
- ETHERSCAN_API_KEY: (optional) for contract verification after deploy

Example `.env` (already included as `.env` file in repo):
```
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
ETHERSCAN_API_KEY=your_etherscan_key
```

## Development notes & tips
- Candidates can only be added/removed before the election starts; voters must be registered by the owner.
- The frontend expects the contract to expose the functions named above; if you change contract names/signatures, update `frontend/src/utils/contract`.
- The sample frontend listens to the VoteCast event to update UI counts in real time.

## Links to important files
- Contract: contracts/Voting.sol
- Hardhat scripts: scripts/deploy.js
- Root Hardhat config & scripts: package.json (root)
- Frontend main: frontend/src/App.jsx
- Frontend components: frontend/src/components/

## Contributing
- Bug reports and pull requests are welcome.
- When adding features, include or update unit tests in the Hardhat test suite and ensure the frontend helpers remain compatible.

## License
MIT
```
