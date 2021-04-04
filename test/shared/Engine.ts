import { Wei, toBN, formatEther, parseEther, parseWei, convertFromInt, BigNumber } from './Units'
import { Contract } from 'ethers'
import { getTradingFunction } from './ReplicationMath'

export const EngineEvents = {
  POSITION_UPDATED: 'PositionUpdated',
  CREATE: 'Create',
  UPDATE: 'Update',
  ADDED_BOTH: 'AddedBoth',
  REMOVED_BOTH: 'RemovedBoth',
  ADDED_X: 'AddedX',
  REMOVED_X: 'RemovedX',
}

export interface Reserve {
  RX1: Wei
  RY2: Wei
  liquidity: Wei
}

export async function getReserve(engine: Contract, poolId: string, log?: boolean): Promise<Reserve> {
  const res = await engine.getReserve(poolId)
  const reserve: Reserve = {
    RX1: new Wei(res.RX1),
    RY2: new Wei(res.RY2),
    liquidity: new Wei(res.liquidity),
  }
  if (log)
    console.log(`
      RX1: ${formatEther(res.RX1)},
      RY2: ${formatEther(res.RY2)},
      liquidity: ${formatEther(res.liquidity)},
    `)
  return reserve
}

export interface Position {
  owner: string
  nonce: number
  BX1: Wei
  BY2: Wei
  liquidity: Wei
  unlocked: boolean
}

export async function getPosition(engine: Contract, owner: string, nonce: number, log?: boolean): Promise<Position> {
  const pos = await engine.getPosition(owner, nonce)
  const position: Position = {
    owner: pos.owner,
    nonce: pos.nonce,
    BX1: new Wei(pos.BX1),
    BY2: new Wei(pos.BY2),
    liquidity: new Wei(pos.liquidity),
    unlocked: pos.unlocked,
  }
  if (log)
    console.log(`
      owner: ${pos.owner},
      nonce: ${pos.nonce},
      BX1: ${formatEther(pos.BX1)},
      BY2: ${formatEther(pos.BY2)},
      liquidity: ${formatEther(pos.liquidity)},
      unlocked: ${pos.unlocked}
    `)
  return position
}

export interface Calibration {
  strike: BigNumber
  sigma: number
  time: number
}

export async function getCalibration(engine: Contract, poolId: string, log?: boolean): Promise<Calibration> {
  const cal = await engine.getCalibration(poolId)
  const calibration: Calibration = {
    strike: toBN(cal.strike),
    sigma: +cal.sigma,
    time: +cal.time,
  }
  if (log)
    console.log(`
        Strike: ${formatEther(cal.strike)},
        Sigma:  ${cal.sigma},
        Time:   ${cal.time}
      `)
  return calibration
}

export interface PoolParams {
  reserve: Reserve
  calibration: Calibration
}

export async function getPoolParams(engine: Contract, poolId: string, log?: boolean): Promise<PoolParams> {
  const reserve: Reserve = await getReserve(engine, poolId)
  const calibration: Calibration = await getCalibration(engine, poolId)
  return { reserve, calibration }
}

export function calculateInvariant(params: PoolParams): number {
  const input: number = getTradingFunction(params.reserve.RX1, params.reserve.liquidity, params.calibration)
  const invariant: Wei = params.reserve.RY2.sub(parseEther(input > 0.0001 ? input.toString() : '0'))
  return invariant.float
}

export function getOutputAmount(params: PoolParams, deltaX: Wei): Wei {
  const RX1: Wei = params.reserve.RX1.add(deltaX)
  const RY2: Wei = params.reserve.RY2
  const liquidity: Wei = params.reserve.liquidity
  const PostRY2: Wei = parseWei(getTradingFunction(RX1, liquidity, params.calibration).toString())
  const deltaY = PostRY2.gt(RY2.raw) ? PostRY2.sub(RY2.raw) : RY2.sub(PostRY2)
  return deltaY
}

export interface SwapXOutput {
  deltaY: Wei
  feePaid: Wei
  postParams: PoolParams
  postInvariant: number
}

/**
 * @notice Returns the amount of Y removed by adding X.
 * @param deltaX The amount of X to add or remove, can be negative.
 * @param invariantInt128 The previous invariant value.
 * @param fee The amount of Y kept as a fee.
 * @param params Parameters of the engine, including strike,time,sigma,RX1,RY2
 * @returns Next R1 amount
 * @returns Next R2 amount
 * @returns Amount of Y output
 */
export function getDeltaY(deltaX: Wei, invariantInt128: string, fee: Wei, params: PoolParams): SwapXOutput {
  const RX1: Wei = params.reserve.RX1
  const RY2: Wei = params.reserve.RY2
  const liquidity: Wei = params.reserve.liquidity
  const invariant: Wei = parseWei(convertFromInt(invariantInt128))
  let FXR1 = RX1.add(deltaX)
  const FX = parseWei(getTradingFunction(FXR1, liquidity, params.calibration).toString())
  let FYR2 = invariant.add(FX)
  let deltaY = FYR2.gt(RY2) ? FYR2.sub(RY2) : RY2.sub(FYR2)
  let feePaid = deltaY.div(fee)
  const yToX = deltaX.raw.isNegative()
  deltaY = yToX ? deltaY.add(feePaid) : deltaY.sub(feePaid)
  FYR2 = yToX ? RY2.add(deltaY) : RY2.sub(deltaY)
  const postParams: PoolParams = {
    reserve: {
      RX1: FXR1,
      RY2: FYR2,
      liquidity: params.reserve.liquidity,
    },
    calibration: params.calibration,
  }
  const postInvariant: number = calculateInvariant(postParams)
  return { deltaY, feePaid, postParams, postInvariant }
}

export function addBoth(deltaL: Wei, params: PoolParams): [Wei, Wei, PoolParams, number] {
  const { RX1, RY2, liquidity } = params.reserve
  const deltaX = deltaL.mul(RX1).div(liquidity)
  const deltaY = deltaL.mul(RY2).div(liquidity)
  const postRX1 = deltaX.add(RX1)
  const postRY2 = deltaY.add(RY2)
  const postLiquidity = deltaL.add(liquidity)
  const post: PoolParams = {
    reserve: {
      RX1: postRX1,
      RY2: postRY2,
      liquidity: postLiquidity,
    },
    calibration: params.calibration,
  }
  const postInvariant: number = calculateInvariant(post)
  return [deltaX, deltaY, post, postInvariant]
}