
import type { TypedAbiArg, TypedAbiFunction, TypedAbiMap, TypedAbiVariable, Response } from '@clarigen/core';

export const contracts = {
  market: {
  "functions": {
    isPaused: {"name":"is-paused","access":"private","args":[],"outputs":{"type":"bool"}} as TypedAbiFunction<[], boolean>,
    isValidActiveMarket: {"name":"is-valid-active-market","access":"private","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":"bool"}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], boolean>,
    addLiquidity: {"name":"add-liquidity","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"stx-amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, stxAmount: TypedAbiArg<number | bigint, "stxAmount">], Response<bigint, bigint>>,
    claimWinnings: {"name":"claim-winnings","access":"public","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], Response<bigint, bigint>>,
    createMarket: {"name":"create-market","access":"public","args":[{"name":"initial-liquidity","type":"uint128"},{"name":"yes-percentage","type":"uint128"},{"name":"fee-numerator","type":"uint128"},{"name":"title","type":{"string-ascii":{"length":70}}}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[initialLiquidity: TypedAbiArg<number | bigint, "initialLiquidity">, yesPercentage: TypedAbiArg<number | bigint, "yesPercentage">, feeNumerator: TypedAbiArg<number | bigint, "feeNumerator">, title: TypedAbiArg<string, "title">], Response<bigint, bigint>>,
    removeLiquidity: {"name":"remove-liquidity","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"lp-tokens-to-remove","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"lp-tokens-removed","type":"uint128"},{"name":"stx-returned","type":"uint128"}]},"error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, lpTokensToRemove: TypedAbiArg<number | bigint, "lpTokensToRemove">], Response<{
  "lpTokensRemoved": bigint;
  "stxReturned": bigint;
}, bigint>>,
    resolveMarket: {"name":"resolve-market","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"outcome","type":"bool"}],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, outcome: TypedAbiArg<boolean, "outcome">], Response<boolean, bigint>>,
    swapNoToStx: {"name":"swap-no-to-stx","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"no-amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, noAmount: TypedAbiArg<number | bigint, "noAmount">], Response<bigint, bigint>>,
    swapStxToNo: {"name":"swap-stx-to-no","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"stx-amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, stxAmount: TypedAbiArg<number | bigint, "stxAmount">], Response<bigint, bigint>>,
    swapStxToYes: {"name":"swap-stx-to-yes","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"stx-amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, stxAmount: TypedAbiArg<number | bigint, "stxAmount">], Response<bigint, bigint>>,
    swapYesToStx: {"name":"swap-yes-to-stx","access":"public","args":[{"name":"market-id","type":"uint128"},{"name":"yes-amount","type":"uint128"}],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, yesAmount: TypedAbiArg<number | bigint, "yesAmount">], Response<bigint, bigint>>,
    togglePause: {"name":"toggle-pause","access":"public","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    calculateK: {"name":"calculate-k","access":"read_only","args":[{"name":"yes-pool","type":"uint128"},{"name":"no-pool","type":"uint128"}],"outputs":{"type":"uint128"}} as TypedAbiFunction<[yesPool: TypedAbiArg<number | bigint, "yesPool">, noPool: TypedAbiArg<number | bigint, "noPool">], bigint>,
    getContractBalance: {"name":"get-contract-balance","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getContractStxBalance: {"name":"get-contract-stx-balance","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getIsPaused: {"name":"get-is-paused","access":"read_only","args":[],"outputs":{"type":"bool"}} as TypedAbiFunction<[], boolean>,
    getLpPositionInfo: {"name":"get-lp-position-info","access":"read_only","args":[{"name":"market-id","type":"uint128"},{"name":"user","type":"principal"}],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"lp-token-value","type":"uint128"},{"name":"position-value","type":"uint128"},{"name":"total-liquidity","type":"uint128"},{"name":"total-lp-tokens","type":"uint128"},{"name":"user-lp-tokens","type":"uint128"}]},"error":{"response":{"ok":"none","error":"uint128"}}}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, user: TypedAbiArg<string, "user">], Response<{
  "lpTokenValue": bigint;
  "positionValue": bigint;
  "totalLiquidity": bigint;
  "totalLpTokens": bigint;
  "userLpTokens": bigint;
}, Response<null, bigint>>>,
    getMarket: {"name":"get-market","access":"read_only","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"fee-numerator","type":"uint128"},{"name":"no-pool","type":"uint128"},{"name":"outcome","type":{"optional":"bool"}},{"name":"resolved","type":"bool"},{"name":"title","type":{"string-ascii":{"length":70}}},{"name":"total_lp_tokens","type":"uint128"},{"name":"yes-pool","type":"uint128"}]},"error":{"response":{"ok":"none","error":"uint128"}}}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], Response<{
  "feeNumerator": bigint;
  "noPool": bigint;
  "outcome": boolean | null;
  "resolved": boolean;
  "title": string;
  "total_lp_tokens": bigint;
  "yesPool": bigint;
}, Response<null, bigint>>>,
    getMarketDetails: {"name":"get-market-details","access":"read_only","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"k","type":"uint128"},{"name":"no-pool","type":"uint128"},{"name":"outcome","type":{"optional":"bool"}},{"name":"resolved","type":"bool"},{"name":"total-liquidity","type":"uint128"},{"name":"total-lp-tokens","type":"uint128"},{"name":"yes-pool","type":"uint128"}]},"error":{"response":{"ok":"none","error":"uint128"}}}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], Response<{
  "k": bigint;
  "noPool": bigint;
  "outcome": boolean | null;
  "resolved": boolean;
  "totalLiquidity": bigint;
  "totalLpTokens": bigint;
  "yesPool": bigint;
}, Response<null, bigint>>>,
    getTitle: {"name":"get-title","access":"read_only","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"string-ascii":{"length":70}},"error":{"response":{"ok":"none","error":"uint128"}}}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], Response<string, Response<null, bigint>>>,
    getTotalMarkets: {"name":"get-total-markets","access":"read_only","args":[],"outputs":{"type":"uint128"}} as TypedAbiFunction<[], bigint>,
    getUserLp: {"name":"get-user-lp","access":"read_only","args":[{"name":"market-id","type":"uint128"},{"name":"user","type":"principal"}],"outputs":{"type":"uint128"}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, user: TypedAbiArg<string, "user">], bigint>,
    getUserPosition: {"name":"get-user-position","access":"read_only","args":[{"name":"market-id","type":"uint128"},{"name":"user","type":"principal"}],"outputs":{"type":{"tuple":[{"name":"no","type":"uint128"},{"name":"yes","type":"uint128"}]}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">, user: TypedAbiArg<string, "user">], {
  "no": bigint;
  "yes": bigint;
}>,
    isMarketResolved: {"name":"is-market-resolved","access":"read_only","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":{"response":{"ok":"bool","error":{"response":{"ok":"none","error":"uint128"}}}}}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], Response<boolean, Response<null, bigint>>>,
    marketExists_q: {"name":"market-exists?","access":"read_only","args":[{"name":"market-id","type":"uint128"}],"outputs":{"type":"bool"}} as TypedAbiFunction<[marketId: TypedAbiArg<number | bigint, "marketId">], boolean>
  },
  "maps": {
    lpPositions: {"name":"lp-positions","key":{"tuple":[{"name":"market-id","type":"uint128"},{"name":"user","type":"principal"}]},"value":"uint128"} as TypedAbiMap<{
  "marketId": number | bigint;
  "user": string;
}, bigint>,
    markets: {"name":"markets","key":"uint128","value":{"tuple":[{"name":"fee-numerator","type":"uint128"},{"name":"no-pool","type":"uint128"},{"name":"outcome","type":{"optional":"bool"}},{"name":"resolved","type":"bool"},{"name":"title","type":{"string-ascii":{"length":70}}},{"name":"total_lp_tokens","type":"uint128"},{"name":"yes-pool","type":"uint128"}]}} as TypedAbiMap<number | bigint, {
  "feeNumerator": bigint;
  "noPool": bigint;
  "outcome": boolean | null;
  "resolved": boolean;
  "title": string;
  "total_lp_tokens": bigint;
  "yesPool": bigint;
}>,
    userPositions: {"name":"user-positions","key":{"tuple":[{"name":"market-id","type":"uint128"},{"name":"user","type":"principal"}]},"value":{"tuple":[{"name":"no","type":"uint128"},{"name":"yes","type":"uint128"}]}} as TypedAbiMap<{
  "marketId": number | bigint;
  "user": string;
}, {
  "no": bigint;
  "yes": bigint;
}>
  },
  "variables": {
    ERR_ARITHMETIC_OVERFLOW: {
  name: 'ERR-ARITHMETIC-OVERFLOW',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_CALCULATION_FAILED: {
  name: 'ERR-CALCULATION-FAILED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_CONTRACT_PAUSED: {
  name: 'ERR-CONTRACT-PAUSED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_EXCESSIVE_SLIPPAGE: {
  name: 'ERR-EXCESSIVE-SLIPPAGE',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INSUFFICIENT_BALANCE: {
  name: 'ERR-INSUFFICIENT-BALANCE',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INSUFFICIENT_LIQUIDITY: {
  name: 'ERR-INSUFFICIENT-LIQUIDITY',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_AMOUNT: {
  name: 'ERR-INVALID-AMOUNT',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_FEE: {
  name: 'ERR-INVALID-FEE',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_MARKET: {
  name: 'ERR-INVALID-MARKET',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_ODDS: {
  name: 'ERR-INVALID-ODDS',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_TITLE: {
  name: 'ERR-INVALID-TITLE',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_MARKET_NOT_FOUND: {
  name: 'ERR-MARKET-NOT-FOUND',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_MARKET_NOT_RESOLVED: {
  name: 'ERR-MARKET-NOT-RESOLVED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_MARKET_RESOLVED: {
  name: 'ERR-MARKET-RESOLVED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NO_FEES_TO_CLAIM: {
  name: 'ERR-NO-FEES-TO-CLAIM',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NO_OUTCOME: {
  name: 'ERR-NO-OUTCOME',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NO_POSITION: {
  name: 'ERR-NO-POSITION',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NO_WINNINGS: {
  name: 'ERR-NO-WINNINGS',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NOT_AUTHORIZED: {
  name: 'ERR-NOT-AUTHORIZED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_REENTRANT_CALL: {
  name: 'ERR-REENTRANT-CALL',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_TRANSFER_FAILED: {
  name: 'ERR-TRANSFER-FAILED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    PRECISION: {
  name: 'PRECISION',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    allowedFunction: {
  name: 'allowed-function',
  type: {
    optional: 'principal'
  },
  access: 'variable'
} as TypedAbiVariable<string | null>,
    contractInitialized: {
  name: 'contract-initialized',
  type: 'bool',
  access: 'variable'
} as TypedAbiVariable<boolean>,
    contractOwner: {
  name: 'contract-owner',
  type: 'principal',
  access: 'variable'
} as TypedAbiVariable<string>,
    contractPaused: {
  name: 'contract-paused',
  type: 'bool',
  access: 'variable'
} as TypedAbiVariable<boolean>,
    nextMarketId: {
  name: 'next-market-id',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>
  },
  constants: {
  eRRARITHMETICOVERFLOW: {
    isOk: false,
    value: 108n
  },
  eRRCALCULATIONFAILED: {
    isOk: false,
    value: 117n
  },
  eRRCONTRACTPAUSED: {
    isOk: false,
    value: 119n
  },
  eRREXCESSIVESLIPPAGE: {
    isOk: false,
    value: 118n
  },
  eRRINSUFFICIENTBALANCE: {
    isOk: false,
    value: 107n
  },
  eRRINSUFFICIENTLIQUIDITY: {
    isOk: false,
    value: 111n
  },
  eRRINVALIDAMOUNT: {
    isOk: false,
    value: 105n
  },
  eRRINVALIDFEE: {
    isOk: false,
    value: 114n
  },
  eRRINVALIDMARKET: {
    isOk: false,
    value: 113n
  },
  eRRINVALIDODDS: {
    isOk: false,
    value: 116n
  },
  eRRINVALIDTITLE: {
    isOk: false,
    value: 11n
  },
  eRRMARKETNOTFOUND: {
    isOk: false,
    value: 101n
  },
  eRRMARKETNOTRESOLVED: {
    isOk: false,
    value: 103n
  },
  eRRMARKETRESOLVED: {
    isOk: false,
    value: 102n
  },
  eRRNOFEESTOCLAIM: {
    isOk: false,
    value: 115n
  },
  eRRNOOUTCOME: {
    isOk: false,
    value: 104n
  },
  eRRNOPOSITION: {
    isOk: false,
    value: 109n
  },
  eRRNOWINNINGS: {
    isOk: false,
    value: 110n
  },
  eRRNOTAUTHORIZED: {
    isOk: false,
    value: 2n
  },
  eRRREENTRANTCALL: {
    isOk: false,
    value: 112n
  },
  eRRTRANSFERFAILED: {
    isOk: false,
    value: 150n
  },
  PRECISION: 1_000_000_000_000n,
  allowedFunction: null,
  contractInitialized: false,
  contractOwner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  contractPaused: false,
  nextMarketId: 1n
},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[],"epoch":"Epoch30","clarity_version":"Clarity2",
  contractName: 'market',
  }
} as const;

export const accounts = {"deployer":{"address":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","balance":"100000000000000"},"faucet":{"address":"STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6","balance":"100000000000000"},"wallet_1":{"address":"ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5","balance":"100000000000000"},"wallet_2":{"address":"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG","balance":"100000000000000"},"wallet_3":{"address":"ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC","balance":"100000000000000"},"wallet_4":{"address":"ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND","balance":"100000000000000"},"wallet_5":{"address":"ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB","balance":"100000000000000"},"wallet_6":{"address":"ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0","balance":"100000000000000"},"wallet_7":{"address":"ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ","balance":"100000000000000"},"wallet_8":{"address":"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP","balance":"100000000000000"}} as const;

export const identifiers = {"market":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.market"} as const

export const simnet = {
  accounts,
  contracts,
  identifiers,
} as const;


export const deployments = {"market":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.market","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.market","testnet":null,"mainnet":null}} as const;

export const project = {
  contracts,
  deployments,
} as const;
  