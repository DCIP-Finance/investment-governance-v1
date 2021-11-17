import { task } from 'hardhat/config'
// import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-gas-reporter'
import 'hardhat-contract-sizer'

import { mnemonic, bscApiKey, coinmarketcapApiKey } from './secrets.json'

export default {
  defaultNetwork: 'mainnet',
  namedAccounts: {
    ownAcc: 1,
    deployer: 0
  },
  accounts: [mnemonic],
  etherscan: {
    apiKey: bscApiKey
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    hardhat: {
      live: false,
      saveDeployments: true,
      forking: {
        url: 'getanode.com',
        blockNumber: 10361577
      }
    },
    testnet: {
      live: true,
      url: 'getanode.com',
      chainId: 97,
      gasPrice: 10000000000,
      accounts: { mnemonic }
    },
    mainnet: {
      live: true,
      url: 'getanode.com',
      chainId: 56,
      gasPrice: 20000000000,
      accounts: { mnemonic: mnemonic }
    }
  },
  gasReporter: {
    enabled: true,
    showTimeSpent: true,
    gasPrice: 21,
    coinmarketCap: coinmarketcapApiKey
  },
  solidity: {
    compilers: [
      {
        version: '0.6.6',
        settings: {
          evmVersion: 'istanbul',
          optimizer: {
            enabled: true,
            runs: 999999
          }
        }
      },
      {
        version: '0.6.8',
        settings: {
          optimizer: {
            enabled: true,
            runs: 5
          }
        }
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999
          }
        }
      }
    ]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  },
  mocha: {
    timeout: 20000
  }
}
