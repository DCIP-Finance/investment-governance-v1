import { BigNumber, BigNumberish, Contract } from 'ethers'
import { ethers, network } from 'hardhat'
import { string } from 'hardhat/internal/core/params/argumentTypes'
import { DCIP } from '../../typechain/DCIP'
import { DCIPGovernor } from '../../typechain/DCIPGovernor'
import { OtcSale } from '../../typechain/OtcSale'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function mineBlocks(blockNumber: number) {
  while (blockNumber > 0) {
    blockNumber--
    await network.provider.request({
      method: 'evm_mine',
      params: []
    })
  }
}

export async function getDcipAddress(hre: HardhatRuntimeEnvironment) {
  const { network } = hre
  let tokenAddress: string
  if (network.name == 'hardhat') {
    tokenAddress = (await hre.deployments.get('DCIP')).address
  } else if (network.name == 'mainnet') {
    tokenAddress = '0x308fc5cdd559be5cb62b08a26a4699bbef4a888f'
  } else {
    throw new Error('Invalid networkName configured')
  }
  return tokenAddress
}

// export async function addDcipBalance(giver: DCIP, taker: string, amount: BigNumberish) {
//   giver.transfer(amount)

//   const returnContract = await getContracts()
//   return {

//   }
// }

export async function setupUsers<T extends { [contractName: string]: Contract }>(
  addresses: string[],
  contracts: T
): Promise<({ address: string } & T)[]> {
  const users: ({ address: string } & T)[] = []
  for (const address of addresses) {
    users.push(await setupUser(address, contracts))
  }
  return users
}

export async function setupUser<T extends { [contractName: string]: Contract }>(
  address: string,
  contracts: T
): Promise<{ address: string } & T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = { address }
  for (const key of Object.keys(contracts)) {
    user[key] = contracts[key].connect(await ethers.getSigner(address))
  }
  return user as { address: string } & T
}

export function weiToBnb(value: number) {
  return BigNumber.from(value).mul(BigNumber.from(10).pow(BigNumber.from(18)))
}

export function numberToDcip(value: number) {
  return BigNumber.from(value).mul(BigNumber.from(10).pow(BigNumber.from(9)))
}

export const ownableRevertText = 'Ownable: caller is not the owner'
