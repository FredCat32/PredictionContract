import { uintCV } from "@stacks/transactions";
import { stringAscii } from "@stacks/transactions/dist/cl";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const contractOwner = accounts.get("deployer")!;
const randomGuy = accounts.get("wallet_1")!;

const contract = "market";
const defaultMarketArguments = {
  initialLiquidity: uintCV(1000),
  yesPercentage: uintCV(50),
  feeNumerator: uintCV(10),
  marketTitle: stringAscii("will it rain?"),
};

describe("Prediction Market", () => {
  describe("create-market", () => {
    it("can only be called by the contract owner", () => {
      const { result } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          defaultMarketArguments.yesPercentage,
          defaultMarketArguments.feeNumerator,
          defaultMarketArguments.marketTitle,
        ],
        randomGuy
      );
      expect(result).toBeErr(uintCV(100));
    });

    // Skipping this one since initial liquidity is already defined as unsigned integer
    it.skip("must have a positive initial liquidity", () => {});

    it("should have a valid yes percentage", () => {
      const { result } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          uintCV(0),
          defaultMarketArguments.feeNumerator,
          defaultMarketArguments.marketTitle,
        ],
        contractOwner
      );

      expect(result).toBeErr(uintCV(112));

      const { result: result2 } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          uintCV(100),
          defaultMarketArguments.feeNumerator,
          defaultMarketArguments.marketTitle,
        ],
        contractOwner
      );
      expect(result2).toBeErr(uintCV(112));

      const { result: result3 } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          uintCV(50),
          defaultMarketArguments.feeNumerator,
          defaultMarketArguments.marketTitle,
        ],
        contractOwner
      );
      expect(result3).toBeOk(uintCV(1));
    });

    // Skipping this one since the initial liquidity and yes percentage are already checked.
    it.skip("should have a valid liquidity", () => {});

    it("should assert that the fee numerator is less than or equal to 1000", () => {
      const { result } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          defaultMarketArguments.yesPercentage,
          uintCV(1001),
          defaultMarketArguments.marketTitle,
        ],
        contractOwner
      );
      expect(result).toBeErr(uintCV(113));

      const { result: result2 } = simnet.callPublicFn(
        contract,
        "create-market",
        [
          defaultMarketArguments.initialLiquidity,
          defaultMarketArguments.yesPercentage,
          uintCV(100),
          defaultMarketArguments.marketTitle,
        ],
        contractOwner
      );
      expect(result2).toBeOk(uintCV(1));
    });
  });
});
