import { test, describe } from "vitest";
import {
  addLiquidityFailureInsufficientStx,
  addLiquidityFailureInvalidAmount,
  addLiquidityFailureMarketNotFound,
  addLiquidityFailureMarketResolved,
  addLiquiditySuccess,
  createMarketFailureBadOdds,
  createMarketFailureFeeTooHigh,
  createMarketFailureInsufficientFunds,
  createMarketFailureNoLiquidity,
  createMarketSuccess,
  createMarketUnauthorized,
  removeLiquidityAvailableFailure,
  removeLiquidityFailureMarketNotFound,
  removeLiquidityFailureMarketResolved,
  removeLiquiditySuccess,
  removeLiquidityUnauthorized,
  resolveMarketFailureMarketNotFound,
  resolveMarketFailureMarketResolved,
  resolveMarketSuccess,
  resolveMarketUnauthorized,
  swapNoToStxSuccess,
  swapStxToNoInsufficientStx,
  swapStxToNoMarketNotFound,
  swapStxToNoMarketResolved,
  swapStxToNoSuccess,
  swapStxToYesInsufficientStx,
  swapStxToYesMarketNotFound,
  swapStxToYesMarketResolved,
  swapStxToYesSuccess,
  swapYesToStxSuccess,
  throwError,
  user_1,
  user_2,
  user_3,
} from "./utils";

describe("create-market", () => {
  test("should create market successfully", async () => {
    // 50/50 market with .1% fee
    await createMarketSuccess(10000000n, 5000n, 10n, "Test Market");
    // 70/30 market with 1% fee
    await createMarketSuccess(10000000000n, 7000n, 100n, "Test Market 2");
    // 90/10 market with 5% fee
    await createMarketSuccess(1000000n, 9000n, 1000n, "Test Market 3");
  });
  test("should not create market with unauthorized user", async () => {
    await createMarketUnauthorized();
  });
  test("should not create market with bad odds", async () => {
    await createMarketFailureBadOdds();
  });
  test("should not create market with fee too high", async () => {
    await createMarketFailureFeeTooHigh();
  });
  test("should not create market with no liquidity", async () => {
    await createMarketFailureNoLiquidity();
  });
  test("should not create market with insufficient funds", async () => {
    await createMarketFailureInsufficientFunds();
  });
});

describe("add-liquidity", () => {
  test("should add liquidity successfully", async () => {
    await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
    await addLiquiditySuccess(1n, user_1, 500000n);
  });
  test("should add liquidity successfully and have correct liquidity", async () => {
    await createMarketSuccess(1000000n, 5000n, 10n, "TestMarket");
    await addLiquiditySuccess(1n, user_1, 500000n);
    const marketId = 1n;
    const additionalLiquidity = 800000n;
    await addLiquiditySuccess(marketId, user_3, additionalLiquidity);
  });
  test(
    "should not add liquidity with insufficient STX",
    addLiquidityFailureInsufficientStx
  );
  test(
    "should not add liquidity with market resolved",
    addLiquidityFailureMarketResolved
  );
  test(
    "only add liquidity to created market",
    addLiquidityFailureMarketNotFound
  );
  test(
    "fails to add liquidity if value is 0",
    addLiquidityFailureInvalidAmount
  );
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("remove-liquidity", () => {
  test("should remove liquidity successfully", async () => {
    await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
    await addLiquiditySuccess(1n, user_1, 500000n);
    await removeLiquiditySuccess(1n, 250000n);
  });
  test(
    "should not allow more liquidity to be removed than available",
    removeLiquidityAvailableFailure
  );
  test(
    "should not remove liquidity with unauthorized user",
    removeLiquidityUnauthorized
  );
  test(
    "should not remove liquidity with market resolved",
    removeLiquidityFailureMarketResolved
  );
  test(
    "only remove liquidity from created market",
    removeLiquidityFailureMarketNotFound
  );
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("swap-stx-to-yes", () => {
  test("should swap STX to YES successfully", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToYesSuccess(1n, 100000n);
  });

  test("can swap multiple times", async () => {
    await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
    await addLiquiditySuccess(1n, user_1, 500000n);
    await swapStxToYesSuccess(1n, 100000n);
    // await swapStxToYesSuccess(1n, 1000n);
  });
  test("should not swap STX to YES with insufficient STX", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToYesInsufficientStx();
  });
  test("should not swap STX to YES with market resolved", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToYesMarketResolved();
  });
  test("only swap STX to YES for created market", swapStxToYesMarketNotFound);
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("swap-stx-to-no", () => {
  test("should swap STX to NO successfully", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    const stxToSwap = 100000n;
    await swapStxToNoSuccess(1n, stxToSwap);
  });
  test("can swap multiple time to NO", async () => {
    await createMarketSuccess(1000000n, 5000n, 10n, "Test Market");
    await addLiquiditySuccess(1n, user_1, 500000n);
    await swapStxToNoSuccess(1n, 100000n);
    await swapStxToYesSuccess(1n, 1000n);
  });
  test("should not swap STX to NO with insufficient STX", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToNoInsufficientStx();
  });
  test("should not swap STX to NO with market resolved", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToNoMarketResolved();
  });
  test("only swap STX to NO for created market", swapStxToNoMarketNotFound);
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("swap-yes-to-stx", () => {
  test("should swap YES to STX successfully", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await addLiquiditySuccess(1n, user_1, 1000000n);
    await swapYesToStxSuccess(1n, 50000n);
  });
  // test(
  //   "should not swap YES to STX with unauthorized user",
  //   swapYesToStxUnauthorized
  // );
  // test(
  //   "should not swap YES to STX with insufficient YES",
  //   swapYesToStxInsufficientYes
  // );
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("swap-no-to-stx", () => {
  test("should swap NO to STX successfully", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await swapStxToNoSuccess(1n, 100000n);
    await swapNoToStxSuccess(1n, 10000n);
  });
  // test(
  //   "should not swap NO to STX with unauthorized user",
  //   swapNoToStxUnauthorized
  // );
  // test(
  //   "should not swap NO to STX with insufficient NO",
  //   swapNoToStxInsufficientNo
  // );
  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});

describe("Resolve market", () => {
  test("should resolve market successfully", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await resolveMarketSuccess(1n);
  });
  test("should not resolve market with unauthorized user", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await resolveMarketUnauthorized();
  });
  test("should not resolve market with market not found", async () => {
    await resolveMarketFailureMarketNotFound();
  });
  test("should not resolve market with market already resolved", async () => {
    const initialLiquidityMStx = 1000000n;
    const yesPercentage = 5000n;
    const feePercentage = 1000n;
    await createMarketSuccess(
      initialLiquidityMStx,
      yesPercentage,
      feePercentage,
      "Test Market"
    );
    await resolveMarketSuccess(1n);
    await resolveMarketFailureMarketResolved();
  });

  test("fails if not valid active market", throwError);
  test("fails if contract is paused", throwError);
});
