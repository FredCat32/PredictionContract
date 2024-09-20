To ensure the security and functionality of the provided Clarity smart contract, you should write a comprehensive suite of tests. Below are the test cases grouped by functionality, which will help validate key behaviors in the contract. The testing framework assumed is Clarity’s test framework.

### Test Cases for Core Functions

#### 1. **Test for `create-market`**

- **Should create a market with valid inputs**:
  - Ensure that the market is created with the correct initial liquidity, percentage, fee, and title.
  - Validate that the `market-id` is incremented correctly.
- **Should fail to create a market if not called by the owner**:

  - Ensure that `ERR-NOT-AUTHORIZED` is returned when a non-owner tries to create a market.

- **Should fail with invalid liquidity**:

  - Test for `ERR-INVALID-AMOUNT` when `initial-liquidity` is 0.

- **Should fail with invalid odds percentage**:

  - Test for `ERR-INVALID-ODDS` when `yes-percentage` is outside the allowed range (e.g., below 100 or above 9900).

- **Should fail with an invalid title**:
  - Test for `ERR-INVALID-TITLE` when the title string is empty or too long.

#### 2. **Test for `add-liquidity`**

- **Should successfully add liquidity to an active market**:

  - Test adding liquidity to an existing, active market.
  - Validate the updated pool sizes, total liquidity, and user LP positions.

- **Should fail if market is resolved**:

  - Ensure that adding liquidity to a resolved market returns `ERR-MARKET-RESOLVED`.

- **Should fail with invalid amount**:

  - Test for `ERR-INVALID-AMOUNT` when `stx-amount` is 0.

- **Should correctly mint LP tokens**:
  - Validate that the correct number of LP tokens are minted based on the current liquidity pools.

#### 3. **Test for `remove-liquidity`**

- **Should successfully remove liquidity**:

  - Test removing liquidity from an active market.
  - Validate that the user receives the correct amount of STX and that the pool sizes are updated correctly.

- **Should fail if market is resolved**:

  - Ensure that removing liquidity from a resolved market returns `ERR-MARKET-RESOLVED`.

- **Should fail with insufficient balance**:
  - Test for `ERR-INSUFFICIENT-BALANCE` if the user tries to remove more liquidity than they own.

#### 4. **Test for `swap-stx-to-yes` and `swap-stx-to-no`**

- **Should swap STX for yes tokens**:

  - Test swapping STX for yes tokens and validate that the pool balances, user's yes position, and total liquidity are updated correctly.

- **Should swap STX for no tokens**:

  - Test swapping STX for no tokens and validate the same as for yes tokens.

- **Should fail with invalid amount**:

  - Test for `ERR-INVALID-AMOUNT` when the swap amount is 0.

- **Should fail if market is resolved**:
  - Ensure that swaps fail for resolved markets with `ERR-MARKET-RESOLVED`.

#### 5. **Test for `swap-yes-to-stx` and `swap-no-to-stx`**

- **Should swap yes tokens for STX**:

  - Test swapping yes tokens for STX and validate the updated pool balances and user positions.

- **Should swap no tokens for STX**:

  - Test swapping no tokens for STX and validate the same as for yes tokens.

- **Should fail with invalid amount**:

  - Test for `ERR-INVALID-AMOUNT` when the swap amount is 0.

- **Should fail with insufficient balance**:
  - Test for `ERR-INSUFFICIENT-BALANCE` when the user tries to swap more yes/no tokens than they hold.

#### 6. **Test for `resolve-market`**

- **Should resolve market successfully by the owner**:

  - Ensure that the market is resolved correctly when called by the contract owner.
  - Validate that the correct pool is updated with the total liquidity (based on the outcome).

- **Should fail if called by non-owner**:

  - Test for `ERR-NOT-AUTHORIZED` when a non-owner tries to resolve the market.

- **Should fail if market is already resolved**:
  - Ensure that resolving an already resolved market returns `ERR-MARKET-RESOLVED`.

#### 7. **Test for `claim-winnings`**

- **Should successfully claim winnings**:

  - Test claiming winnings when the user has a winning position.
  - Ensure that the user’s position is cleared after claiming, and the correct amount of STX is transferred.

- **Should fail if market is not resolved**:

  - Ensure that claiming winnings for unresolved markets returns `ERR-MARKET-NOT-RESOLVED`.

- **Should fail with no winnings**:
  - Test for `ERR-NO-WINNINGS` if the user tries to claim winnings with no position or a losing position.

#### 8. **Test for Fee Handling**

- **Should calculate and apply fees correctly**:

  - Ensure that the fee is correctly deducted from swaps and that the fee is reinvested into the pool (as per the fee handling mechanism).

- **Test for valid fee ranges**:
  - Ensure that fees outside the valid range (e.g., greater than `1000` basis points) return `ERR-INVALID-FEE`.

#### 9. **Test for Edge Cases**

- **Test for market creation edge cases**:

  - Attempt to create a market with edge values, such as the smallest and largest possible liquidity values, and ensure that the contract behaves as expected.

- **Test for rounding errors**:

  - Check for potential rounding issues in liquidity calculations, especially when small amounts of liquidity are added or removed.

- **Test for maximum precision**:
  - Ensure that the precision (`u1000000000000`) used in calculations does not cause overflow or underflow during swaps or liquidity changes.

#### 10. **Test for Read-Only Functions**

- **Test `get-market-details`**:

  - Ensure that the correct market details are returned, including pool sizes, liquidity, and resolved state.

- **Test `get-user-position`**:

  - Validate that the user’s yes/no positions are correctly returned for various markets.

- **Test `get-lp-position-info`**:
  - Ensure that the correct LP token and liquidity details are returned for the user’s position.

#### 11. **Reentrancy and Unauthorized Access**

- **Test for unauthorized access to `resolve-market` and `create-market`**:

  - Ensure that non-owners cannot create or resolve markets.

- **Test for reentrancy protection**:
  - Although Clarity inherently prevents reentrancy attacks, write tests that attempt multiple state changes within a single transaction to ensure the contract handles these correctly.

#### 12. **Test for Corner Cases**

- **Should fail when market ID does not exist**:

  - Test functions with invalid market IDs and ensure they return `ERR-MARKET-NOT-FOUND`.

- **Test market resolution edge cases**:

  - Test for markets with equal yes/no pools and ensure correct behavior upon market resolution.

- **Test multiple positions for the same user**:
  - Ensure that users with both yes and no positions can correctly manage their liquidity and claim winnings without errors.

---

### Example Test Case (for `create-market`):

```clarity
(define-public (test-create-market-valid)
  (let ((result (create-market u10000 u5000 u100 "Test Market")))
    (asserts! (is-ok result) (err u0)) ;; should pass with valid inputs
    (asserts! (is-eq (unwrap-panic result) u1) true))) ;; check the correct market-id is returned

(define-public (test-create-market-not-authorized)
  (let ((result (as-tx-sender (tx-sender) (create-market u10000 u5000 u100 "Test Market"))))
    (asserts! (is-err result) ERR-NOT-AUTHORIZED))) ;; ensure unauthorized users cannot create markets
```

### Example Test Case (for `swap-stx-to-yes`):

```clarity
(define-public (test-swap-stx-to-yes-valid)
  (let ((result (swap-stx-to-yes u1 u1000)))
    (asserts! (is-ok result) (err u0)) ;; should succeed with valid swap
    ;; further asserts for pool size changes, user position updates, etc.
  ))
```

---

These tests will help ensure the contract is secure, accurate, and functions as expected across all edge cases and normal use cases.
