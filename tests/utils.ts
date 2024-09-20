import { CoreNodeEventType, cvToValue, projectFactory } from "@clarigen/core";
import { project, accounts } from "../src/clarigen-types";
import {
  rov,
  rovOk,
  txOk,
  txErr,
  mapGet,
  filterEvents,
  rovErr,
  varGet,
} from "@clarigen/test";

import { test, describe, expect } from "vitest";

export const { market } = projectFactory(project, "simnet");
export const deployer = market.constants.contractOwner;
export const user_1 = accounts.wallet_1.address;
export const user_2 = accounts.wallet_2.address;
export const user_3 = accounts.wallet_3.address;
const PRECISION = market.constants.PRECISION;
const CONTRACT_ID = market.identifier;

export const throwError = () => expect(true).toBe(false);

const getMarket = async (marketId: bigint) => {
  return mapGet(CONTRACT_ID, market.maps.markets, marketId);
};

const getUserPosition = async (marketId: bigint, user: string) => {
  try {
    return mapGet(CONTRACT_ID, market.maps.userPositions, {
      marketId: marketId,
      user: user,
    });
  } catch (e) {
    return {
      yes: 0n,
      no: 0n,
    };
  }
};

const calculateAndDeductFee = async (marketId: bigint, stxToSwap: bigint) => {
  const market = await getMarket(marketId);
  const feePercentage = market!.feeNumerator;
  const feeAmount = (stxToSwap * feePercentage) / 10000n;
  const netAmount = stxToSwap - feeAmount;
  return {
    netAmount,
    feeAmount,
  };
};

const getNetAmount = async (marketId: bigint, stxToSwap: bigint) => {
  const calculateAndDeductFeeResult = await calculateAndDeductFee(
    marketId,
    stxToSwap
  );
  const feeAmount = calculateAndDeductFeeResult.feeAmount;
  return stxToSwap - feeAmount;
};

const calcToAdd = (stxAmount: bigint, pool: bigint, totalLiquidity: bigint) => {
  if (totalLiquidity === 0n) {
    return stxAmount / 2n;
  }
  return (stxAmount * pool) / totalLiquidity;
};

const calculateToProportion = (
  stxAmount: bigint,
  currentPosition: bigint,
  totalLiquidity: bigint
) => {
  let x = stxAmount * currentPosition;
  x = x * PRECISION;
  return x / totalLiquidity;
};

// ############################################################################################
// CREATE MARKET
// ############################################################################################

export const createMarketSuccess = async (
  initialLiquidityMStx: bigint,
  yesPercentage: bigint,
  feeNumerator: bigint,
  title: string
) => {
  const marketId = varGet<bigint>(CONTRACT_ID, market.variables.nextMarketId);
  const initialLiquidity = rov(market.getUserLp(marketId, deployer));

  const createMarketReceipt = txOk(
    market.createMarket(
      initialLiquidityMStx,
      yesPercentage,
      feeNumerator,
      title
    ),
    deployer
  );

  const createdMarket = rov(market.getMarket(marketId)).value;
  const createdMarketDetails = rov(market.getMarketDetails(marketId)).value;
  const postLiquidity = rov(market.getUserLp(marketId, deployer));

  const printEvents = filterEvents(
    createMarketReceipt.events,
    CoreNodeEventType.ContractEvent
  );

  expect(printEvents.length).toEqual(1);

  const [evt1] = printEvents;

  const evt1Data = cvToValue<{
    event: string;
    marketId: bigint;
    initialLiquidity: bigint;
    yesPercentage: bigint;
    feeNumerator: bigint;
  }>(evt1.data.value);

  expect(evt1Data).toEqual({
    event: "market-created",
    title: title,
    marketId: marketId,
    initialLiquidity: initialLiquidityMStx,
    yesPercentage: yesPercentage,
    feeNumerator: feeNumerator,
  });

  const nextMarketId = varGet<bigint>(
    CONTRACT_ID,
    market.variables.nextMarketId
  );

  expect(nextMarketId).toEqual(marketId + 1n);

  expect(postLiquidity).toEqual(initialLiquidity + initialLiquidityMStx);

  const yesPool = (initialLiquidityMStx * yesPercentage) / 10000n;
  const noPool = initialLiquidityMStx - yesPool;

  expect(createdMarket).toEqual({
    title: title,
    feeNumerator: feeNumerator,
    noPool: noPool,
    outcome: null,
    resolved: false,
    total_lp_tokens: initialLiquidityMStx,
    yesPool: yesPool,
  });

  expect(createdMarketDetails).toEqual({
    resolved: false,
    outcome: null,
    yesPool: yesPool,
    noPool: noPool,
    totalLiquidity: postLiquidity,
    totalLpTokens: postLiquidity,
    k: yesPool * noPool,
  });

  expect(createMarketReceipt.value).toEqual(marketId);
};

export const createMarketUnauthorized = async () => {
  const createMarkettReceipt = txErr(
    market.createMarket(100, 50, 10, "Test"),
    user_1
  );
  expect(createMarkettReceipt.value).toEqual(
    market.constants.eRRNOTAUTHORIZED.value
  );
};

export const createMarketFailureFeeTooHigh = async () => {
  const createMarkettReceipt = txErr(
    market.createMarket(100, 100, 1100, "Test"),
    deployer
  );
  expect(createMarkettReceipt.value).toEqual(
    market.constants.eRRINVALIDFEE.value
  );
};

export const createMarketFailureBadOdds = async () => {
  const createMarkettReceipt = txErr(
    market.createMarket(100, 50, 10, "Test"),
    deployer
  );
  expect(createMarkettReceipt.value).toEqual(
    market.constants.eRRINVALIDODDS.value
  );
};

export const createMarketFailureNoLiquidity = async () => {
  const createMarkettReceipt = txErr(
    market.createMarket(0, 50, 10, "Test"),
    deployer
  );
  expect(createMarkettReceipt.value).toEqual(
    market.constants.eRRINVALIDAMOUNT.value
  );
};

export const createMarketFailureInsufficientFunds = async () => {
  const createMarkettReceipt = txErr(
    market.createMarket(100000000000000000000000000000, 50, 10, "Test"),
    user_1
  );
  expect(createMarkettReceipt.value).toEqual(2n);
};

// ############################################################################################
// ADD LIQUIDITY
// ############################################################################################

export const addLiquiditySuccess = async (
  marketId: bigint,
  user: string,
  mStxAmount: bigint
) => {
  const initialMarket = rovOk(market.getMarket(marketId));
  const liquidity = rovOk(market.getLpPositionInfo(marketId, deployer));
  const userLp = rov(market.getUserLp(marketId, user));
  const userPosition = rov(market.getUserPosition(marketId, user));
  const totalLiquidity = initialMarket.total_lp_tokens;

  console.log({ liquidity, userLp, userPosition, totalLiquidity });

  //   console.log(initialMarket, liquidity);

  const yesPool = initialMarket.yesPool;
  const noPool = initialMarket.noPool;

  //   const liquidityYes = calcToAdd(stxAmount, yesPool, totalLiquidity);
  //   const liquidityNo = calcToAdd(stxAmount, noPool, totalLiquidity);

  const initialYes = userPosition.yes;
  const initialNo = userPosition.no;

  const addLiquidityReceipt = txOk(
    market.addLiquidity(marketId, mStxAmount),
    user
  );

  const updatedMarket = rovOk(market.getMarket(marketId));
  const userUpdatedPosition = rov(market.getUserPosition(marketId, user));
  const userUpdatedLiquidity = rov(market.getUserLp(marketId, deployer));

  console.log({
    updatedMarket,
    userUpdatedPosition,
    userUpdatedLiquidity,
    addLiquidityReceipt,
  });

  expect(updatedMarket.total_lp_tokens).toEqual(
    initialMarket.total_lp_tokens + mStxAmount
  );

  // expect(userUpdatedPosition).toEqual({
  //   yes: initialYes + liquidityYes,
  //   no: initialNo + liquidityNo,
  // });

  //   expect(addLiquidityReceipt.value).toEqual({
  //     yes: liquidityYes,
  //     no: liquidityNo,
  //   });
};

export const addLiquidityFailureInsufficientStx = async () => {
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  const marketId = 1n;
  const insufficientLiquidity = 1000000000000000n; // A very large amount
  const addLiquidityReceipt = txErr(
    market.addLiquidity(marketId, insufficientLiquidity),
    user_1
  );
  expect(addLiquidityReceipt.value).toEqual(150n);
};

export const addLiquidityFailureMarketNotFound = async () => {
  const nonExistentMarketId = 999n;
  const liquidity = 100000n;

  const addLiquidityReceipt = txErr(
    market.addLiquidity(nonExistentMarketId, liquidity),
    user_1
  );

  expect(addLiquidityReceipt.value).toEqual(101n); // Assuming 1 is the error code for market not found
};

export const addLiquidityFailureMarketResolved = async () => {
  // Create market first
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  const marketId = 1n;

  // Resolve the market
  txOk(market.resolveMarket(marketId, true), deployer);

  // Attempt to add liquidity to resolved market
  const liquidity = 100000n;
  const addLiquidityReceipt = txErr(
    market.addLiquidity(marketId, liquidity),
    user_1
  );

  expect(addLiquidityReceipt.value).toEqual(102n); // Assuming 102 is the error code for market resolved
};

export const addLiquidityFailureInvalidAmount = async () => {
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  const marketId = 1n;
  const liquidity = 0n;
  const addLiquidityReceipt = txErr(
    market.addLiquidity(marketId, liquidity),
    user_1
  );
  expect(addLiquidityReceipt.value).toEqual(105n); // Assuming 150 is the error code for invalid amount
};

// ############################################################################################
// REMOVE LIQUIDITY
// ############################################################################################

export const removeLiquiditySuccess = async (
  marketId: bigint,
  stxToRemove: bigint
) => {
  const initialMarket = await getMarket(marketId);
  const userInitialPosition = await getUserPosition(marketId, user_1);

  const removeLiquidityReceipt = txOk(
    market.removeLiquidity(marketId, stxToRemove),
    user_1
  );

  const userTotalLiquidity = userInitialPosition!.yes + userInitialPosition!.no;

  const yesToRemove = calculateToProportion(
    stxToRemove,
    userInitialPosition!.yes,
    userTotalLiquidity
  );
  const noToRemove = calculateToProportion(
    stxToRemove,
    userInitialPosition!.no,
    userTotalLiquidity
  );

  const updatedMarket = await getMarket(marketId);
  const updatedUserPosition = await getUserPosition(marketId, user_1);

  //   // Check if the market's total liquidity has decreased
  //   expect(updatedMarket?.totalLiquidity).toEqual(
  //     initialMarket!.totalLiquidity - stxToRemove
  //   );

  // // Check if the user's position has decreased
  expect(updatedUserPosition).toEqual({
    yes: userInitialPosition!.yes - yesToRemove / PRECISION,
    no: userInitialPosition!.no - noToRemove / PRECISION,
  });

  // Check the return value of removeLiquidity
  expect(removeLiquidityReceipt.value).toEqual({
    yes: yesToRemove / PRECISION,
    no: noToRemove / PRECISION,
  });
};

export const removeLiquidityAvailableFailure = async () => {
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  await addLiquiditySuccess(1n, user_1, 500000n);
  const marketId = 1n;
  const liquidityToRemove = 500001n;
  // Remove liquidity
  const removeLiquidityReceipt = txErr(
    market.removeLiquidity(marketId, liquidityToRemove),
    user_1
  );
  expect(removeLiquidityReceipt.value).toEqual(111n);
};

export const removeLiquidityUnauthorized = async () => {
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  await addLiquiditySuccess(1n, user_1, 500000n);
  const marketId = 1n;
  const liquidityToRemove = 250000n;
  const removeLiquidityReceipt = txErr(
    market.removeLiquidity(marketId, liquidityToRemove),
    user_2
  );
  expect(removeLiquidityReceipt.value).toEqual(109n);
};

export const removeLiquidityFailureMarketResolved = async () => {
  await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
  await addLiquiditySuccess(1n, user_1, 500000n);
  const marketId = 1n;
  const liquidityToRemove = 250000n;
  txOk(market.resolveMarket(marketId, true), deployer);
  const removeLiquidityReceipt = txErr(
    market.removeLiquidity(marketId, liquidityToRemove),
    user_1
  );
  expect(removeLiquidityReceipt.value).toEqual(102n);
};

export const removeLiquidityFailureMarketNotFound = async () => {
  const marketId = 1n;
  const liquidityToRemove = 250000n;
  const removeLiquidityReceipt = txErr(
    market.removeLiquidity(marketId, liquidityToRemove),
    user_1
  );
  expect(removeLiquidityReceipt.value).toEqual(101n);
};

// ############################################################################################
// SWAP STX TO YES
// ############################################################################################

export const swapStxToYesSuccess = async (
  marketId: bigint,
  stxToSwap: bigint
) => {
  const initialUserPosition = await getUserPosition(marketId, user_1);
  const currentMarket = await getMarket(marketId);
  const yesPool = currentMarket!.yesPool;
  const totalLiquidity = currentMarket!.total_lp_tokens;

  const swapStxToYesReceipt = txOk(
    market.swapStxToYes(marketId, stxToSwap),
    user_1
  );

  const userPosition = await getUserPosition(marketId, user_1);

  const netAmount = await getNetAmount(marketId, stxToSwap);

  const yesAmount = (netAmount * yesPool) / (totalLiquidity + netAmount);

  expect(swapStxToYesReceipt.value).toEqual(yesAmount);

  expect(userPosition).toEqual({
    yes: initialUserPosition!.yes + yesAmount,
    no: initialUserPosition!.no,
  });

  const printEvents = filterEvents(
    swapStxToYesReceipt.events,
    CoreNodeEventType.ContractEvent
  );

  expect(printEvents.length).toEqual(1);

  const [evt] = printEvents;

  const evtData = cvToValue<{
    event: string;
    marketId: bigint;
    user: string;
    stxAmount: bigint;
    yesAmount: bigint;
  }>(evt.data.value);

  expect(evtData).toEqual({
    event: "swap-to-yes",
    marketId: 1n,
    user: user_1,
    stxAmount: stxToSwap,
    yesAmount: yesAmount,
    netBetAmount: netAmount,
  });
};

export const swapStxToYesInsufficientStx = async () => {
  const marketId = 1n;
  const stxToSwap = 1000000000000000n;
  const swapStxToYesReceipt = txErr(
    market.swapStxToYes(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToYesReceipt.value).toEqual(150n);
};

export const swapStxToYesMarketResolved = async () => {
  const marketId = 1n;
  txOk(market.resolveMarket(marketId, true), deployer);
  const stxToSwap = 100000n;
  const swapStxToYesReceipt = txErr(
    market.swapStxToYes(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToYesReceipt.value).toEqual(113n);
};

export const swapStxToYesMarketNotFound = async () => {
  const marketId = 1n;
  const stxToSwap = 100000n;
  const swapStxToYesReceipt = txErr(
    market.swapStxToYes(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToYesReceipt.value).toEqual(101n);
};

// ############################################################################################
// SWAP STX TO NO
// ############################################################################################

export const swapStxToNoSuccess = async (
  marketId: bigint,
  stxToSwap: bigint
) => {
  const initialUserPosition = await getUserPosition(marketId, user_1);
  const currentMarket = await getMarket(marketId);
  const swapStxToNoReceipt = txOk(
    market.swapStxToNo(marketId, stxToSwap),
    user_1
  );

  const noPool = currentMarket!.noPool;
  const totalLiquidity = currentMarket!.totalLiquidity;
  const userPosition = await getUserPosition(marketId, user_1);
  const netAmount = await getNetAmount(marketId, stxToSwap);

  const netNoAmount = (netAmount * noPool) / (totalLiquidity + netAmount);

  expect(swapStxToNoReceipt.value).toEqual(netNoAmount);

  expect(userPosition).toEqual({
    yes: initialUserPosition!.yes,
    no: initialUserPosition!.no + netNoAmount,
  });

  const printEvents = filterEvents(
    swapStxToNoReceipt.events,
    CoreNodeEventType.ContractEvent
  );

  expect(printEvents.length).toEqual(1);

  const [evt] = printEvents;

  const evtData = cvToValue<{
    event: string;
    marketId: bigint;
    user: string;
    stxAmount: bigint;
    noAmount: bigint;
  }>(evt.data.value);

  expect(evtData).toEqual({
    event: "swap-to-no",
    marketId: 1n,
    user: user_1,
    stxAmount: stxToSwap,
    noAmount: netNoAmount,
  });
};

export const swapStxToNoInsufficientStx = async () => {
  const marketId = 1n;
  const stxToSwap = 1000000000000000n;
  const swapStxToNoReceipt = txErr(
    market.swapStxToNo(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToNoReceipt.value).toEqual(150n);
};

export const swapStxToNoMarketResolved = async () => {
  const marketId = 1n;
  txOk(market.resolveMarket(marketId, true), deployer);
  const stxToSwap = 100000n;
  const swapStxToNoReceipt = txErr(
    market.swapStxToNo(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToNoReceipt.value).toEqual(113n);
};

export const swapStxToNoMarketNotFound = async () => {
  const marketId = 1n;
  const stxToSwap = 100000n;
  const swapStxToNoReceipt = txErr(
    market.swapStxToNo(marketId, stxToSwap),
    user_1
  );
  expect(swapStxToNoReceipt.value).toEqual(101n);
};

// ############################################################################################
// RESOLVE MARKET
// ############################################################################################

export const resolveMarketSuccess = async (marketId: bigint) => {
  txOk(market.resolveMarket(marketId, true), deployer);
  const resolvedMarket = await getMarket(marketId);
  expect(resolvedMarket?.resolved).toEqual(true);
};

export const resolveMarketUnauthorized = async () => {
  const marketId = 1n;
  const resolveMarketReceipt = txErr(
    market.resolveMarket(marketId, true),
    user_1
  );
  expect(resolveMarketReceipt.value).toEqual(2n);
};

export const resolveMarketFailureMarketNotFound = async () => {
  const marketId = 1n;
  const resolveMarketReceipt = txErr(
    market.resolveMarket(marketId, true),
    user_1
  );
  expect(resolveMarketReceipt.value).toEqual(101n);
};

export const resolveMarketFailureMarketResolved = async () => {
  const marketId = 1n;
  const resolveMarketReceipt = txErr(
    market.resolveMarket(marketId, true),
    deployer
  );
  expect(resolveMarketReceipt.value).toEqual(102n);
};

export const swapYesToStxSuccess = async (
  marketId: bigint,
  stxToSwap: bigint
) => {
  const currentMarket = await getMarket(marketId);
  const initialUserPosition = await getUserPosition(marketId, user_1);

  const swapYesToStxReceipt = txOk(
    market.swapYesToStx(marketId, stxToSwap),
    user_1
  );

  let porportion = stxToSwap * currentMarket!.totalLiquidity;

  porportion = porportion / currentMarket!.yesPool;

  const netAmount = await getNetAmount(marketId, porportion);

  expect(swapYesToStxReceipt.value).toEqual(netAmount);

  const userPosition = await getUserPosition(marketId, user_1);

  expect(userPosition).toEqual({
    yes: initialUserPosition!.yes - stxToSwap,
    no: initialUserPosition!.no,
  });

  const printEvents = filterEvents(
    swapYesToStxReceipt.events,
    CoreNodeEventType.ContractEvent
  );

  expect(printEvents.length).toEqual(1);

  const [evt] = printEvents;

  const evtData = cvToValue<{
    event: string;
    marketId: bigint;
    user: string;
    stxAmount: bigint;
    yesAmount: bigint;
  }>(evt.data.value);

  expect(evtData).toEqual({
    event: "swap-yes-to-stx",
    marketId: marketId,
    user: user_1,
    stxAmount: netAmount,
    yesAmount: stxToSwap,
  });
};

export const swapNoToStxSuccess = async (
  marketId: bigint,
  stxToSwap: bigint
) => {
  const currentMarket = await getMarket(marketId);
  const initialUserPosition = await getUserPosition(marketId, user_1);
  const swapYesToStxReceipt = txOk(
    market.swapNoToStx(marketId, stxToSwap),
    user_1
  );

  let porportion = stxToSwap * currentMarket!.totalLiquidity;

  porportion = porportion / currentMarket!.noPool;

  const netAmount = await getNetAmount(marketId, porportion);

  expect(swapYesToStxReceipt.value).toEqual(netAmount);

  const userPosition = await getUserPosition(marketId, user_1);

  expect(userPosition).toEqual({
    yes: initialUserPosition!.yes,
    no: initialUserPosition!.no - stxToSwap,
  });

  const printEvents = filterEvents(
    swapYesToStxReceipt.events,
    CoreNodeEventType.ContractEvent
  );

  expect(printEvents.length).toEqual(1);

  const [evt] = printEvents;

  const evtData = cvToValue<{
    event: string;
    marketId: bigint;
    user: string;
    stxAmount: bigint;
    yesAmount: bigint;
  }>(evt.data.value);

  expect(evtData).toEqual({
    event: "swap-no-to-stx",
    marketId: marketId,
    user: user_1,
    stxAmount: netAmount,
    noAmount: stxToSwap,
  });
};
