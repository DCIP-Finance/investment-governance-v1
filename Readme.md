Usage

1. Create a secrets.json based on secrets.example.json

Set network in your env: (mainnet, testnet, hardhat)
HARDHAT_NETWORK=yournetwork

npx hardhat deploy
npx hardhat etherscan-verify
npx hardhat test (Test does not require deploy if on local network)
