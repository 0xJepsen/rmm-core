import { primitiveEngineFixture, PrimitiveEngineFixture } from '../../fixtures'
import { Wallet } from 'ethers'
import { loadFixture } from 'ethereum-waffle'

import { Create, Create__factory } from '../../../../typechain'

export type PrimitiveEngineCreateFixture = PrimitiveEngineFixture & { create: Create }

export async function primitiveEngineCreateFixture(signers: Wallet[]): Promise<PrimitiveEngineCreateFixture> {
  const [deployer] = signers
  const engineFixture = await loadFixture(primitiveEngineFixture)

  const create = await new Create__factory(deployer).deploy(
    engineFixture.primitiveEngine.address,
    engineFixture.risky.address,
    engineFixture.stable.address
  )

  return {
    ...engineFixture,
    create,
  }
}
