import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { BigNumber } from 'ethers'
import { getDcipAddress } from '../test/utils'

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()
  let tokenAddress = await getDcipAddress(hre)

  await deploy('DCIPGovernor', {
    from: deployer,
    args: [tokenAddress, 200],
    log: true,
    gasPrice: BigNumber.from(20000000000),
    gasLimit: 10000000
  })
}
export default func
func.tags = ['DCIPGovernor']
func.dependencies = ['DCIP']
