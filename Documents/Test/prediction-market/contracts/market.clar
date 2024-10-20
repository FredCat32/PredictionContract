;; Error Constants as Strings (Hyphens in Error Messages, Not Variable Names)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-RESOLVED (err u102))
(define-constant ERR-MARKET-NOT-RESOLVED (err u103))
(define-constant ERR-NO-OUTCOME (err u104))
(define-constant ERR-INVALID-AMOUNT (err u105))
(define-constant ERR-TRANSFER-FAILED (err u106))
(define-constant ERR-INSUFFICIENT-BALANCE (err u107))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u108))
(define-constant ERR-NO-POSITION (err u109))
(define-constant ERR-NO-WINNINGS (err u110))
(define-constant ERR-EXCESSIVE-SLIPPAGE (err u111))
(define-constant ERR-INVALID-ODDS (err u112))
(define-constant ERR-INVALID-FEE (err u113))
(define-constant ERR-INVALID-TITLE (err u114))
(define-constant ERR-INVALID-MARKET (err u115))
(define-constant ERR-CALCULATION-FAILED (err u116))
(define-constant ERR-INVARIANT-BROKEN (err u117))

;; Precision Constant
(define-constant PRECISION u1000000)


;; Data Variables
(define-data-var contract-owner principal tx-sender)
(define-data-var next-market-id uint u1)

;; Data Variables
(define-data-var reentrancy-guard bool false)
(define-data-var allowed-function (optional principal) none)
(define-data-var contract-initialized bool false)

;; Check if the caller is the contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender (var-get contract-owner))
)

(define-public (set-allowed-function (function principal))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (ok (var-set allowed-function (some function)))
  )
)

(define-map markets uint {
  resolved: bool,
  outcome: (optional bool),
  lp-yes-pool: uint,    ;; Liquidity provider YES pool
  lp-no-pool: uint,     ;; Liquidity provider NO pool
  bet-yes-pool: uint,   ;; Total YES bets
  bet-no-pool: uint,    ;; Total NO bets
  total-lp-tokens: uint,
  fee-numerator: uint,
  market-title: (string-ascii 70)
})

(define-map lp-positions { market-id: uint, user: principal } uint)

;; Helper Functions
;; Updated user-positions map

(define-map user-positions { market-id: uint, user: principal } {
  yes-stx: uint,      ;; STX invested in YES bets
  no-stx: uint,       ;; STX invested in NO bets
  yes-tokens: uint,   ;; YES tokens held
  no-tokens: uint     ;; NO tokens held
})


;; Helper function to calculate k (product of pools)
(define-read-only (calculate-k (yes-pool uint) (no-pool uint))
  (* yes-pool no-pool)
)

(define-private (transfer-stx (amount uint) (sender principal) (recipient principal))
  (stx-transfer? amount sender recipient)
)

;; Public Functions
(define-public (create-market (initial-liquidity uint) (yes-percentage uint) (fee-numerator uint) (market-title (string-ascii 50)))
  (let
    (
      (market-id (var-get next-market-id))
      (lp-yes-pool (/ (* initial-liquidity yes-percentage) u100))
      (lp-no-pool (- initial-liquidity lp-yes-pool))
      (total-lp-tokens initial-liquidity)
    )
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    ;; This assertion is not necessary since unsigned integers can only be positive
    (asserts! (> initial-liquidity u0) ERR-INVALID-AMOUNT)
    (asserts! (> (len market-title) u0) ERR-INVALID-TITLE)
    (asserts! (and (>= yes-percentage u1) (<= yes-percentage u99)) ERR-INVALID-ODDS)
    ;; This assertion is also not necessary, since the initial liquidity and yes percentage are already checked 
    (asserts! (and (> lp-yes-pool u0) (> lp-no-pool u0)) ERR-INSUFFICIENT-LIQUIDITY)
    (asserts! (and (>= fee-numerator u0) (<= fee-numerator u1000)) ERR-INVALID-FEE)

    (print { event: "market-created", market-id: market-id, initial-liquidity: initial-liquidity, yes-percentage: yes-percentage, fee-numerator: fee-numerator, market-title: market-title })

    (map-set markets market-id {
      resolved: false,
      outcome: none,
      lp-yes-pool: lp-yes-pool,
      lp-no-pool: lp-no-pool,
      bet-yes-pool: u0,
      bet-no-pool: u0,
      total-lp-tokens: total-lp-tokens,
      fee-numerator: fee-numerator,
      market-title: market-title
    })

    (map-set lp-positions
      { market-id: market-id, user: tx-sender }
      total-lp-tokens
    )

    (match (stx-transfer? initial-liquidity tx-sender (as-contract tx-sender))
      success
        (begin
          (var-set next-market-id (+ market-id u1))
          (ok market-id)
        )
      error ERR-TRANSFER-FAILED
    )
  )
)

(define-public (add-liquidity (market-id uint) (stx-amount uint))
  (let (
    (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    (caller tx-sender)
  )
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
    (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)
    
    (let (
      (lp-yes-pool (get lp-yes-pool market))
      (lp-no-pool (get lp-no-pool market))
      (total-lp-tokens (get total-lp-tokens market))
      (total-liquidity (+ lp-yes-pool lp-no-pool))
      (lp-tokens-to-mint (if (is-eq total-lp-tokens u0)
                             stx-amount
                             (/ (* stx-amount total-lp-tokens) total-liquidity)))
      (yes-to-add (/ (* stx-amount lp-yes-pool) total-liquidity))
      (no-to-add (/ (* stx-amount lp-no-pool) total-liquidity))
      (new-lp-yes-pool (+ lp-yes-pool yes-to-add))
      (new-lp-no-pool (+ lp-no-pool no-to-add))
      (new-total-lp-tokens (+ total-lp-tokens lp-tokens-to-mint))
    )
      ;; Update market state
      (map-set markets market-id
        (merge market {
          lp-yes-pool: new-lp-yes-pool,
          lp-no-pool: new-lp-no-pool,
          total-lp-tokens: new-total-lp-tokens
        })
      )
      
      ;; Update LP position
      (map-set lp-positions
        { market-id: market-id, user: caller }
        (+ (default-to u0 (map-get? lp-positions { market-id: market-id, user: caller }))
           lp-tokens-to-mint)
      )
      
      ;; Transfer STX from user to contract
      (match (stx-transfer? stx-amount caller (as-contract tx-sender))
        success
          (begin
            (print {
              event: "add-liquidity",
              market-id: market-id,
              user: caller,
              stx-amount: stx-amount,
              lp-tokens-minted: lp-tokens-to-mint,
              new-lp-yes-pool: new-lp-yes-pool,
              new-lp-no-pool: new-lp-no-pool,
              new-total-lp-tokens: new-total-lp-tokens
            })
            (ok lp-tokens-to-mint)
          )
        error ERR-TRANSFER-FAILED
      )
    )
  )
)
(define-public (remove-liquidity (market-id uint) (lp-tokens-to-remove uint))
  (let (
    (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    (user-lp-tokens (unwrap! (map-get? lp-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
  )
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
    (asserts! (> lp-tokens-to-remove u0) ERR-INVALID-AMOUNT)
    (asserts! (<= lp-tokens-to-remove user-lp-tokens) ERR-INSUFFICIENT-BALANCE)

    (let (
      (lp-yes-pool (get lp-yes-pool market))
      (lp-no-pool (get lp-no-pool market))
      (total-lp-tokens (get total-lp-tokens market))
      (removal-ratio (/ (* lp-tokens-to-remove PRECISION) total-lp-tokens))
      (yes-to-remove (/ (* lp-yes-pool removal-ratio) PRECISION))
      (no-to-remove (/ (* lp-no-pool removal-ratio) PRECISION))
      (stx-to-return (+ yes-to-remove no-to-remove))
      (new-lp-yes-pool (- lp-yes-pool yes-to-remove))
      (new-lp-no-pool (- lp-no-pool no-to-remove))
      (new-total-lp-tokens (- total-lp-tokens lp-tokens-to-remove))
    )

      ;; Update market state
      (map-set markets market-id
        (merge market {
          lp-yes-pool: new-lp-yes-pool,
          lp-no-pool: new-lp-no-pool,
          total-lp-tokens: new-total-lp-tokens
        })
      )

      ;; Update LP position
      (map-set lp-positions
        { market-id: market-id, user: tx-sender }
        (- user-lp-tokens lp-tokens-to-remove)
      )

      ;; Transfer STX back to user
      (match (as-contract (stx-transfer? stx-to-return tx-sender tx-sender))
        success
          (begin
            (print {
              event: "remove-liquidity",
              market-id: market-id,
              user: tx-sender,
              lp-tokens-removed: lp-tokens-to-remove,
              stx-returned: stx-to-return,
              new-lp-yes-pool: new-lp-yes-pool,
              new-lp-no-pool: new-lp-no-pool
            })
            (ok {
              lp-tokens-removed: lp-tokens-to-remove,
              stx-returned: stx-to-return
            })
          )
        error ERR-TRANSFER-FAILED
      )
    )
  )
)


(define-public (swap-stx-to-yes (market-id uint) (stx-amount uint) (min-yes-amount uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (caller tx-sender)
    )
    (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)

    (let
      (
        (lp-yes-pool (get lp-yes-pool market))
        (lp-no-pool (get lp-no-pool market))
        (fee-numerator (get fee-numerator market))
        (fee-denominator u10000)
        (fee-amount (/ (* stx-amount fee-numerator) fee-denominator))
        (amount-in (- stx-amount fee-amount))
        ;; Calculate yes-amount based on amount-in
        (numerator (* amount-in lp-no-pool))
        (denominator (+ lp-yes-pool amount-in))
        (yes-amount (/ numerator denominator))
        ;; LP pools only updated with fees
        (new-lp-yes-pool (+ lp-yes-pool fee-amount))
        (new-lp-no-pool (- lp-no-pool yes-amount))
        ;; Update bet-yes-pool with net investment
        (new-bet-yes-pool (+ (get bet-yes-pool market) amount-in))
      )
      (asserts! (>= yes-amount min-yes-amount) ERR-EXCESSIVE-SLIPPAGE)

      ;; Update market state
      (map-set markets market-id (merge market {
        lp-yes-pool: new-lp-yes-pool,
        lp-no-pool: new-lp-no-pool,
        bet-yes-pool: new-bet-yes-pool
      }))

      ;; Update user position with net investment
      (let
        (
          (current-position (default-to { yes-stx: u0, no-stx: u0, yes-tokens: u0, no-tokens: u0 }
            (map-get? user-positions { market-id: market-id, user: caller })))
        )
        (map-set user-positions
          { market-id: market-id, user: caller }
          {
            yes-stx: (+ (get yes-stx current-position) amount-in),
            no-stx: (get no-stx current-position),
            yes-tokens: (+ (get yes-tokens current-position) yes-amount),
            no-tokens: (get no-tokens current-position)
          })
      )

      ;; Transfer STX from user to contract
      (match (stx-transfer? stx-amount caller (as-contract tx-sender))
        success
          (begin
            (print {
              event: "swap-stx-to-yes",
              market-id: market-id,
              user: caller,
              stx-amount: stx-amount,
              amount-in: amount-in,
              fee-amount: fee-amount,
              yes-amount: yes-amount,
              new-lp-yes-pool: new-lp-yes-pool,
              new-lp-no-pool: new-lp-no-pool,
              new-bet-yes-pool: new-bet-yes-pool
            })
            (ok yes-amount)
          )
        error ERR-TRANSFER-FAILED
      )
    )
  )
)


(define-public (swap-stx-to-no (market-id uint) (stx-amount uint) (min-no-amount uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (caller tx-sender)
    )
    (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)

    (let
      (
        (lp-yes-pool (get lp-yes-pool market))
        (lp-no-pool (get lp-no-pool market))
        (fee-numerator (get fee-numerator market))
        (fee-denominator u10000)
        (fee-amount (/ (* stx-amount fee-numerator) fee-denominator))
        (amount-in (- stx-amount fee-amount))
        ;; Calculate no-amount based on amount-in
        (numerator (* amount-in lp-yes-pool))
        (denominator (+ lp-no-pool amount-in))
        (no-amount (/ numerator denominator))
        ;; LP pools only updated with fees
        (new-lp-no-pool (+ lp-no-pool fee-amount))
        (new-lp-yes-pool (- lp-yes-pool no-amount))
        ;; Update bet-no-pool with net investment
        (new-bet-no-pool (+ (get bet-no-pool market) amount-in))
      )
      (asserts! (>= no-amount min-no-amount) ERR-EXCESSIVE-SLIPPAGE)

      ;; Update market state
      (map-set markets market-id (merge market {
        lp-yes-pool: new-lp-yes-pool,
        lp-no-pool: new-lp-no-pool,
        bet-no-pool: new-bet-no-pool
      }))

      ;; Update user position with net investment
      (let
        (
          (current-position (default-to { yes-stx: u0, no-stx: u0, yes-tokens: u0, no-tokens: u0 }
            (map-get? user-positions { market-id: market-id, user: caller })))
        )
        (map-set user-positions
          { market-id: market-id, user: caller }
          {
            yes-stx: (get yes-stx current-position),
            no-stx: (+ (get no-stx current-position) amount-in),
            yes-tokens: (get yes-tokens current-position),
            no-tokens: (+ (get no-tokens current-position) no-amount)
          })
      )

      ;; Transfer STX from user to contract
      (match (stx-transfer? stx-amount caller (as-contract tx-sender))
        success
          (begin
            (print {
              event: "swap-stx-to-no",
              market-id: market-id,
              user: caller,
              stx-amount: stx-amount,
              amount-in: amount-in,
              fee-amount: fee-amount,
              no-amount: no-amount,
              new-lp-yes-pool: new-lp-yes-pool,
              new-lp-no-pool: new-lp-no-pool,
              new-bet-no-pool: new-bet-no-pool
            })
            (ok no-amount)
          )
        error ERR-TRANSFER-FAILED
      )
    )
  )
)








(define-public (resolve-market (market-id uint) (outcome bool))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
    )
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)

    ;; Only update the resolved status and outcome
    (map-set markets market-id (merge market {
      resolved: true,
      outcome: (some outcome)
    }))

    (print {
      event: "market-resolved",
      market-id: market-id,
      outcome: outcome
    })
    (ok true)
  )
)




(define-public (claim-winnings (market-id uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (user-position (unwrap! (map-get? user-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
    )
    (asserts! (get resolved market) ERR-MARKET-NOT-RESOLVED)
    (asserts! (is-some (get outcome market)) ERR-NO-OUTCOME)
    (let
      (
        (outcome (unwrap! (get outcome market) ERR-NO-OUTCOME))
        (total_bet_pool (+ (get bet-yes-pool market) (get bet-no-pool market)))
        (user_investment (if outcome (get yes-stx user-position) (get no-stx user-position)))
        (winning_pool (if outcome (get bet-yes-pool market) (get bet-no-pool market)))
      )
      (asserts! (> user_investment u0) ERR-NO-WINNINGS)
      (let
        (
          ;; Calculate winnings: proportional share of total bets
          (winnings (/ (* user_investment total_bet_pool) winning_pool))
          (caller tx-sender)
        )
        ;; Remove user's position to prevent double claiming
        (map-delete user-positions { market-id: market-id, user: tx-sender })

        ;; Transfer winnings to the user
       (match (as-contract (stx-transfer? winnings (as-contract tx-sender) caller))
          success
            (begin
              (print {
                event: "winnings-claimed",
                market-id: market-id,
                user: caller,
                winnings: winnings
              })
              (ok winnings)
            )
          error ERR-TRANSFER-FAILED
        )
      )
    )
  )
)




(define-public (claim-lp-winnings (market-id uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (caller tx-sender)
      (lp-tokens (unwrap! (map-get? lp-positions { market-id: market-id, user: caller }) ERR-NO-POSITION))
    )
    (asserts! (get resolved market) ERR-MARKET-NOT-RESOLVED)
    (asserts! (> lp-tokens u0) ERR-NO-WINNINGS)

    (let
      (
        (total-lp-tokens (get total-lp-tokens market))
        (lp-yes-pool (get lp-yes-pool market))
        (lp-no-pool (get lp-no-pool market))
        (bet-yes-pool (get bet-yes-pool market))
        (bet-no-pool (get bet-no-pool market))
        ;; Calculate LP's share
        (removal-ratio (/ (* lp-tokens PRECISION) total-lp-tokens))
        (yes-to-remove (/ (* lp-yes-pool removal-ratio) PRECISION))
        (no-to-remove (/ (* lp-no-pool removal-ratio) PRECISION))
        (stx-to-transfer (+ yes-to-remove no-to-remove))
        (new-total-lp-tokens (- total-lp-tokens lp-tokens))
        (new-lp-yes-pool (- lp-yes-pool yes-to-remove))
        (new-lp-no-pool (- lp-no-pool no-to-remove))
      )
      ;; Print debug information
      (print {
        event: "lp-winnings-debug",
        market-id: market-id,
        user: caller,
        lp-tokens: lp-tokens,
        total-lp-tokens: total-lp-tokens,
        lp-yes-pool: lp-yes-pool,
        lp-no-pool: lp-no-pool,
        bet-yes-pool: bet-yes-pool,
        bet-no-pool: bet-no-pool,
        removal-ratio: removal-ratio,
        yes-to-remove: yes-to-remove,
        no-to-remove: no-to-remove,
        stx-to-transfer: stx-to-transfer,
        new-total-lp-tokens: new-total-lp-tokens,
        new-lp-yes-pool: new-lp-yes-pool,
        new-lp-no-pool: new-lp-no-pool
      })

      ;; Update LP's position
      (map-set lp-positions { market-id: market-id, user: caller } u0)
      ;; Update market state
      (map-set markets market-id (merge market {
        lp-yes-pool: new-lp-yes-pool,
        lp-no-pool: new-lp-no-pool,
        total-lp-tokens: new-total-lp-tokens
      }))

      ;; Print contract balance before transfer
      (print {
        event: "contract-balance-before-transfer",
        balance: (stx-get-balance (as-contract tx-sender))
      })

      ;; Transfer LP's share to the caller
      (match (as-contract (stx-transfer? stx-to-transfer tx-sender caller))
        success
          (begin
            (print {
              event: "lp-winnings-claimed",
              market-id: market-id,
              user: caller,
              stx-transferred: stx-to-transfer,
              new-lp-yes-pool: new-lp-yes-pool,
              new-lp-no-pool: new-lp-no-pool,
              new-total-lp-tokens: new-total-lp-tokens
            })
            (ok stx-to-transfer)
          )
        error 
          (begin
            (print {
              event: "lp-winnings-claim-failed",
              error: "Transfer failed",
              stx-to-transfer: stx-to-transfer,
              contract-balance: (stx-get-balance (as-contract tx-sender))
            })
            ERR-TRANSFER-FAILED
          )
      )
    )
  )
)

;; Read-only functions remain mostly unchanged
(define-read-only (get-user-liquidity (market-id uint) (user principal))
  (match (map-get? lp-positions { market-id: market-id, user: user })
    position (ok position)
    (ok u0)
  )
)

(define-read-only (get-market-title (market-id uint))
  (match (map-get? markets market-id)
    market (ok (get market-title market))
    ERR-MARKET-NOT-FOUND
  )
)
(define-read-only (get-user-position (market-id uint) (user principal))
  (match (map-get? user-positions { market-id: market-id, user: user })
    position (ok position)
    (ok { yes-stx: u0, no-stx: u0, yes-tokens: u0, no-tokens: u0 })
  )
)


(define-read-only (get-total-markets)
  (- (var-get next-market-id) u1))

(define-read-only (market-exists? (market-id uint))
  (is-some (map-get? markets market-id)))
(define-read-only (get-lp-position-info (market-id uint) (user principal))
  (match (map-get? markets market-id)
    market
      (let
        (
          (user-lp-tokens (default-to u0
                           (map-get? lp-positions { market-id: market-id, user: user })))
          (total-lp-tokens (get total-lp-tokens market))
          (total-liquidity (+ (get lp-yes-pool market) (get lp-no-pool market)))
        )

        (ok {
          user-lp-tokens: user-lp-tokens,
          total-lp-tokens: total-lp-tokens,
          total-liquidity: total-liquidity,
          lp-token-value: (if (is-eq total-lp-tokens u0)
                              u0
                              (/ (* total-liquidity PRECISION) total-lp-tokens)),
          position-value: (if (is-eq total-lp-tokens u0)
                              u0
                              (/ (* user-lp-tokens total-liquidity) total-lp-tokens))
        })
      )
    (err ERR-MARKET-NOT-FOUND)
  )
)
(define-read-only (get-market-details (market-id uint))
  (match (map-get? markets market-id)
    market (ok {
      resolved: (get resolved market),
      outcome: (get outcome market),
      lp-yes-pool: (get lp-yes-pool market),
      lp-no-pool: (get lp-no-pool market),
      bet-yes-pool: (get bet-yes-pool market),
      bet-no-pool: (get bet-no-pool market),
      total-liquidity: (+ (get lp-yes-pool market) (get lp-no-pool market)),
      total-lp-tokens: (get total-lp-tokens market),
      k: (calculate-k (get lp-yes-pool market) (get lp-no-pool market))
    })
    (err ERR-MARKET-NOT-FOUND)
  )
)

(define-read-only (is-market-resolved (market-id uint))
  (match (map-get? markets market-id)
    market (ok (get resolved market))
    (err ERR-MARKET-NOT-FOUND)
  )
)

(define-read-only (get-contract-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-user-liquidity-position (market-id uint) (user principal))
  (match (map-get? lp-positions { market-id: market-id, user: user })
    position (ok position)
    (err ERR-NO-POSITION)
  )
)
(define-read-only (get-current-price (market-id uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (lp-yes-pool (get lp-yes-pool market))
      (lp-no-pool (get lp-no-pool market))
    )
    (ok (/ (* lp-yes-pool u1000000) (+ lp-yes-pool lp-no-pool)))  ;; Price in parts per million
  )
)
(define-read-only (estimate-swap-stx-to-yes (market-id uint) (stx-amount uint))
  (let
    (
      (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
      (lp-yes-pool (get lp-yes-pool market))
      (lp-no-pool (get lp-no-pool market))
      (fee-numerator (get fee-numerator market))
      (fee-denominator u10000)
      (fee-amount (/ (* stx-amount fee-numerator) fee-denominator))
      (amount-in (- stx-amount fee-amount))
      (numerator (* amount-in lp-no-pool))
      (denominator (+ lp-yes-pool amount-in))
    )
    (ok (/ numerator denominator))
  )
)

(define-read-only (is-valid-active-market (market-id uint))
  (match (map-get? markets market-id)
    market (and (not (get resolved market)) (is-some (get outcome market)))
    false
  )
)
