(define-constant ERR-NOT-AUTHORIZED (err u2))
(define-constant ERR-MARKET-RESOLVED (err u102))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-NOT-RESOLVED (err u103))
(define-constant ERR-NO-OUTCOME (err u104))
(define-constant ERR-INVALID-AMOUNT (err u105))
(define-constant ERR-TRANSFER-FAILED (err u150))
(define-constant ERR-INSUFFICIENT-BALANCE (err u107))
(define-constant ERR-ARITHMETIC-OVERFLOW (err u108))
(define-constant ERR-NO-POSITION (err u109))
(define-constant ERR-NO-WINNINGS (err u110))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u111))
(define-constant ERR-REENTRANT-CALL (err u112))
(define-constant ERR-INVALID-MARKET (err u113))
(define-constant ERR-INVALID-FEE (err u114))
(define-constant ERR-NO-FEES-TO-CLAIM (err u115))
(define-constant ERR-INVALID-ODDS (err u116))
(define-constant ERR-CALCULATION-FAILED (err u117))
(define-constant ERR-EXCESSIVE-SLIPPAGE (err u118))
(define-constant ERR-INVALID-TITLE (err u11))
(define-constant ERR-CONTRACT-PAUSED (err u119))

(define-constant PRECISION u1000000000000) ;; 10^12 for higher precision

;; Data Variables (unchanged)
(define-data-var contract-owner principal tx-sender)
(define-data-var next-market-id uint u1)
(define-data-var allowed-function (optional principal) none)
(define-data-var contract-initialized bool false)
(define-data-var contract-paused bool false)

(define-map markets uint {
    resolved: bool,
    outcome: (optional bool),
    yes-pool: uint,
    no-pool: uint,
    total_lp_tokens: uint,
    fee-numerator: uint,
    title: (string-ascii 70)
})

(define-map lp-positions { market-id: uint, user: principal } uint)
(define-map user-positions { market-id: uint, user: principal } { yes: uint, no: uint })

;; Helper Functions

(define-private (is-valid-active-market (market-id uint))
  (match (map-get? markets market-id)
    market (not (get resolved market))
    false
  )
)

(define-private (is-paused)
  (is-eq (var-get contract-paused) true)
)

;; Helper function to calculate k
(define-read-only (calculate-k (yes-pool uint) (no-pool uint))
  (* yes-pool no-pool)
)

;; Public Functions
(define-public (create-market (initial-liquidity uint) (yes-percentage uint) (fee-numerator uint) (title (string-ascii 70)))
    (let (
        (market-id (var-get next-market-id))
        (yes-pool (/ (* initial-liquidity yes-percentage) u10000))
        (no-pool (- initial-liquidity yes-pool))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
        (asserts! (> initial-liquidity u0) ERR-INVALID-AMOUNT)
        (asserts! (> (len title) u0) ERR-INVALID-TITLE)
        (asserts! (and (>= yes-percentage u100) (<= yes-percentage u9900)) ERR-INVALID-ODDS)
        (asserts! (and (> yes-pool u0) (> no-pool u0)) ERR-INSUFFICIENT-LIQUIDITY)
        (asserts! (and (>= fee-numerator u0) (<= fee-numerator u1000)) ERR-INVALID-FEE)
        (map-set markets market-id {
            resolved: false,
            outcome: none,
            yes-pool: yes-pool,
            no-pool: no-pool,
            total_lp_tokens: initial-liquidity,
            fee-numerator: fee-numerator,
            title: title
        })
        (map-set lp-positions { market-id: market-id, user: tx-sender } initial-liquidity)
        (try! (stx-transfer? initial-liquidity tx-sender (as-contract tx-sender)))
        (var-set next-market-id (+ market-id u1))
        (print { 
            event: "market-created", 
            market-id: market-id, 
            initial-liquidity: initial-liquidity, 
            yes-percentage: yes-percentage, 
            fee-numerator: fee-numerator, 
            title: title 
        })
        (ok market-id)
    )
)

(define-public (add-liquidity (market-id uint) (stx-amount uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (total_lp_tokens (get total_lp_tokens market))
        (total-liquidity (+ yes-pool no-pool))
        (lp-tokens-to-mint (if (is-eq total_lp_tokens u0) stx-amount (/ (* stx-amount total_lp_tokens) total-liquidity)))
        (yes-to-add (/ (* stx-amount yes-pool) total-liquidity))
        (no-to-add (/ (* stx-amount no-pool) total-liquidity))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
        (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)
        (map-set markets market-id
            (merge market {
                yes-pool: (+ yes-pool yes-to-add),
                no-pool: (+ no-pool no-to-add),
                total_lp_tokens: (+ total_lp_tokens lp-tokens-to-mint)
            })
        )
        (map-set lp-positions { market-id: market-id, user: tx-sender }
            (+ (default-to u0 (map-get? lp-positions { market-id: market-id, user: tx-sender }))
            lp-tokens-to-mint)
        )
        (try! (stx-transfer? stx-amount tx-sender (as-contract tx-sender)))
        (print {
            event: "add-liquidity",
            market-id: market-id,
            user: tx-sender,
            stx-amount: stx-amount,
            initial-yes-pool: yes-pool,
            initial-no-pool: no-pool,
            initial-total-lp-tokens: total_lp_tokens,
            lp-tokens-to-mint: lp-tokens-to-mint,
            yes-to-add: yes-to-add,
            no-to-add: no-to-add,
            new-yes-pool: (+ yes-pool yes-to-add),
            new-no-pool: (+ no-pool no-to-add),
            new-total-lp-tokens: (+ total_lp_tokens lp-tokens-to-mint)
        })
        (ok lp-tokens-to-mint)
    )
)
(define-public (remove-liquidity (market-id uint) (lp-tokens-to-remove uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (user-lp-tokens (unwrap! (map-get? lp-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (total_lp_tokens (get total_lp_tokens market))
        (removal-ratio (/ (* lp-tokens-to-remove PRECISION) total_lp_tokens))
        (yes-to-remove (/ (* yes-pool removal-ratio) PRECISION))
        (no-to-remove (/ (* no-pool removal-ratio) PRECISION))
        (liquidity-to-remove (+ yes-to-remove no-to-remove))
        (new-yes-pool (- yes-pool yes-to-remove))
        (new-no-pool (- no-pool no-to-remove))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)
        (asserts! (> lp-tokens-to-remove u0) ERR-INVALID-AMOUNT)
        (asserts! (<= lp-tokens-to-remove user-lp-tokens) ERR-INSUFFICIENT-BALANCE)
        (map-set markets market-id 
            (merge market {
                yes-pool: new-yes-pool,
                no-pool: new-no-pool,
                total_lp_tokens: (- total_lp_tokens lp-tokens-to-remove)
            })
        )
        (map-set lp-positions { market-id: market-id, user: tx-sender }
            (- user-lp-tokens lp-tokens-to-remove)
        )
        (try! (as-contract (stx-transfer? liquidity-to-remove tx-sender tx-sender)))
        (print {
            event: "liquidity-removed",
            market-id: market-id,
            user: tx-sender,
            lp-tokens-removed: lp-tokens-to-remove,
            stx-returned: liquidity-to-remove,
            lp-tokens-to-remove: lp-tokens-to-remove,
            initial-yes-pool: yes-pool,
            initial-no-pool: no-pool,
            initial-total-lp-tokens: total_lp_tokens,
            removal-ratio: removal-ratio,
            yes-to-remove: yes-to-remove,
            no-to-remove: no-to-remove,
            liquidity-to-remove: liquidity-to-remove,
            new-yes-pool: new-yes-pool,
            new-no-pool: new-no-pool,
            new-total-lp-tokens: (- total_lp_tokens lp-tokens-to-remove)
        })
        (ok {
            lp-tokens-removed: lp-tokens-to-remove,
            stx-returned: liquidity-to-remove
        })        
    )
)
(define-public (swap-stx-to-yes (market-id uint) (stx-amount uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (fee-numerator (get fee-numerator market))
        (initial-k (calculate-k yes-pool no-pool))
        (stx-amount-with-fee (- stx-amount (/ (* stx-amount fee-numerator) u10000)))
        (new-no-pool (+ no-pool stx-amount-with-fee))
        (new-yes-pool (/ initial-k new-no-pool))
        (yes-amount (- yes-pool new-yes-pool))
        (new-k (calculate-k new-yes-pool new-no-pool))
        (current-position (default-to { yes: u0, no: u0 } (map-get? user-positions { market-id: market-id, user: tx-sender })))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-active-market market-id) ERR-INVALID-MARKET)
        (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)
        (map-set markets market-id (merge market {
            yes-pool: new-yes-pool,
            no-pool: new-no-pool
        }))
        (map-set user-positions { market-id: market-id, user: tx-sender }
            {
                yes: (+ (get yes current-position) yes-amount),
                no: (get no current-position)
            }
        )
        (try! (stx-transfer? stx-amount tx-sender (as-contract tx-sender)))      
        (print {
            event: "swap-details",
            swap-type: "stx-to-yes",
            market-id: market-id,
            initial-yes-pool: yes-pool,
            initial-no-pool: no-pool,
            stx-amount: stx-amount,
            stx-amount-with-fee: stx-amount-with-fee,
            new-yes-pool: new-yes-pool,
            new-no-pool: new-no-pool,
            yes-amount: yes-amount,
            initial-k: initial-k,
            new-k: new-k,
            user: tx-sender,
        })
        (ok yes-amount)
  )
)


(define-public (swap-stx-to-no (market-id uint) (stx-amount uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (fee-numerator (get fee-numerator market))
        (initial-k (calculate-k yes-pool no-pool))
        (fee-amount (/ (* stx-amount fee-numerator) u10000)) ;; Calculate the fee
        (stx-amount-with-fee (- stx-amount fee-amount)) ;; Net amount after fee
        (new-yes-pool (+ yes-pool stx-amount-with-fee));; Add the full amount to yes-pool
        (new-no-pool (/ initial-k new-yes-pool))
        (no-amount (- no-pool new-no-pool))
        (new-k (calculate-k new-yes-pool new-no-pool))
        (current-position (default-to { yes: u0, no: u0 } (map-get? user-positions { market-id: market-id, user: tx-sender })))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-active-market market-id) ERR-INVALID-MARKET)
        (asserts! (> stx-amount u0) ERR-INVALID-AMOUNT)
        (map-set markets market-id (merge market {
            yes-pool: new-yes-pool,
            no-pool: new-no-pool
        }))
        (map-set user-positions { market-id: market-id, user: tx-sender }
            {
                yes: (get yes current-position),
                no: (+ (get no current-position) no-amount)
            }
        )
        (try! (stx-transfer? stx-amount tx-sender (as-contract tx-sender)))
        (print {
            event: "swap-to-no",
            initial-yes-pool: yes-pool,
            initial-no-pool: no-pool,
            stx-amount: stx-amount,
            fee-amount: fee-amount,
            stx-amount-with-fee: stx-amount-with-fee,
            new-yes-pool: new-yes-pool,
            new-no-pool: new-no-pool,
            no-amount: no-amount,
            initial-k: initial-k,
            new-k: new-k,
            market-id: market-id,
            user: tx-sender,
        })
        (ok no-amount)
    )
)
(define-public (swap-yes-to-stx (market-id uint) (yes-amount uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (user-position (unwrap! (map-get? user-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (fee-numerator (get fee-numerator market))
        (constant-product (* yes-pool no-pool))
        (new-yes-pool (+ yes-pool yes-amount))
        (new-no-pool (/ constant-product new-yes-pool))
        (stx-amount (- no-pool new-no-pool))
        (fee-amount (/ (* stx-amount fee-numerator) u10000))
        (net-stx-amount (- stx-amount fee-amount))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-active-market market-id) ERR-INVALID-MARKET)
        (asserts! (> yes-amount u0) ERR-INVALID-AMOUNT)
        (asserts! (>= (get yes user-position) yes-amount) ERR-INSUFFICIENT-BALANCE)
        (map-set markets market-id (merge market {
            yes-pool: new-yes-pool,
            no-pool: (+ new-no-pool fee-amount) ;; Reinvest fee into the pool
        }))
        (map-set user-positions
            { market-id: market-id, user: tx-sender }
            (merge user-position {
                yes: (- (get yes user-position) yes-amount)
            })
        )
        (try! (as-contract (stx-transfer? net-stx-amount tx-sender tx-sender)))
        (print {
            event: "swap-yes-to-stx",
            market-id: market-id,
            user: tx-sender,
            yes-amount: yes-amount,
            stx-amount: net-stx-amount,
            fee-amount: fee-amount,
            new-yes-pool: new-yes-pool,
            new-no-pool: (+ new-no-pool fee-amount)
        })
        (ok net-stx-amount)
    
  )
)


(define-public (swap-no-to-stx (market-id uint) (no-amount uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (user-position (unwrap! (map-get? user-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (fee-numerator (get fee-numerator market))
        (constant-product (* yes-pool no-pool))
        (new-no-pool (+ no-pool no-amount))
        (new-yes-pool (/ constant-product new-no-pool))
        (stx-amount (- yes-pool new-yes-pool))
        (fee-amount (/ (* stx-amount fee-numerator) u10000))
        (net-stx-amount (- stx-amount fee-amount))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-active-market market-id) ERR-INVALID-MARKET)
        (asserts! (> no-amount u0) ERR-INVALID-AMOUNT)
        (asserts! (>= (get no user-position) no-amount) ERR-INSUFFICIENT-BALANCE)
        (map-set markets market-id (merge market {
            yes-pool: (+ new-yes-pool fee-amount), ;; Reinvest fee into the pool
            no-pool: new-no-pool
        }))     
        (map-set user-positions
            { market-id: market-id, user: tx-sender }
            (merge user-position {
                no: (- (get no user-position) no-amount)
            })
        )
        (try! (as-contract (stx-transfer? net-stx-amount tx-sender tx-sender)))
        (print {
            event: "swap-no-to-stx",
            market-id: market-id,
            user: tx-sender,
            no-amount: no-amount,
            stx-amount: net-stx-amount,
            fee-amount: fee-amount,
            new-yes-pool: (+ new-yes-pool fee-amount),
            new-no-pool: new-no-pool
        })
        (ok net-stx-amount)

  )
)
(define-public (resolve-market (market-id uint) (outcome bool))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (total-liquidity (+ yes-pool no-pool))
    )
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
        (asserts! (not (get resolved market)) ERR-MARKET-RESOLVED)         
        (map-set markets market-id (merge market {
            resolved: true,
            outcome: (some outcome),
            yes-pool: (if outcome total-liquidity u0),
            no-pool: (if outcome u0 total-liquidity)
        }))           
        (print {
            event: "market-resolved",
            market-id: market-id,
            outcome: outcome,
            total-liquidity: total-liquidity
        })
        (ok true)
    )
)

(define-public (claim-winnings (market-id uint))
    (let (
        (market (unwrap! (map-get? markets market-id) ERR-MARKET-NOT-FOUND))
        (user-position (unwrap! (map-get? user-positions { market-id: market-id, user: tx-sender }) ERR-NO-POSITION))
        (outcome (unwrap! (get outcome market) ERR-NO-OUTCOME))
        (winning-pool (if outcome (get yes-pool market) (get no-pool market)))
        (user-winning-tokens (if outcome (get yes user-position) (get no user-position)))
        (total-winning-tokens (if outcome (get yes-pool market) (get no-pool market)))
        (winnings (/ (* user-winning-tokens winning-pool) total-winning-tokens))
    )
       
        (asserts! (not (is-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (get resolved market) ERR-MARKET-NOT-RESOLVED)
        (asserts! (is-some (get outcome market)) ERR-NO-OUTCOME)
        (asserts! (> user-winning-tokens u0) ERR-NO-WINNINGS)
        (map-delete user-positions { market-id: market-id, user: tx-sender })
        (map-set markets market-id
            (merge market {
                    yes-pool: (if outcome (- (get yes-pool market) winnings) u0),
                    no-pool: (if outcome u0 (- (get no-pool market) winnings))
                }
            )
        )
        (try! (as-contract (stx-transfer? winnings tx-sender tx-sender)))
        (print {
                event: "winnings-claimed",
                market-id: market-id,
                user: tx-sender,
                winnings: winnings
        })
        (ok winnings)
    )
)


(define-public (toggle-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (let ((current-state (var-get contract-paused)))
      (var-set contract-paused (not current-state))
      (ok (var-get contract-paused))
    )
  )
)

;; Read-only functions

(define-read-only (get-lp-position-info (market-id uint) (user principal))
    (let (
        (market (try! (get-market market-id)))
        (user-lp-tokens (get-user-lp market-id user))
        (total-lp-tokens (get total_lp_tokens market))
        (total-liquidity (+ (get yes-pool market) (get no-pool market)))
        (lp-token-value (if (is-eq total-lp-tokens u0) u0 (/ (* total-liquidity PRECISION) total-lp-tokens)))
        (position-value (if (is-eq total-lp-tokens u0) u0 (/ (* user-lp-tokens total-liquidity) total-lp-tokens)))
    )
        (ok {
          user-lp-tokens: user-lp-tokens,
          total-lp-tokens: total-lp-tokens,
          total-liquidity: total-liquidity,
          lp-token-value: lp-token-value,
          position-value: position-value
        })
    )
)

(define-read-only (get-market (market-id uint))
    (ok (unwrap! (map-get? markets market-id) (err ERR-MARKET-NOT-FOUND)))
)
(define-read-only (is-market-resolved (market-id uint))
    (ok (get resolved (try! (get-market market-id))))
)
(define-read-only (get-title (market-id uint))
    (ok (get title (try! (get-market market-id))))
)
(define-read-only (get-market-details (market-id uint))
    (let ((market (try! (get-market market-id))))
        (ok {
            resolved: (get resolved market),
            outcome: (get outcome market),
            yes-pool: (get yes-pool market),
            no-pool: (get no-pool market),
            total-liquidity: (+ (get yes-pool market) (get no-pool market)),
            total-lp-tokens: (get total_lp_tokens market),
            k: (calculate-k (get yes-pool market) (get no-pool market))
        }
    ))
)
(define-read-only (get-user-position (market-id uint) (user principal))
    (default-to { yes: u0, no: u0 } (map-get? user-positions { market-id: market-id, user: user }))
)
(define-read-only (market-exists? (market-id uint)) (is-some (map-get? markets market-id)))
(define-read-only (get-total-markets) (- (var-get next-market-id) u1))
(define-read-only (get-contract-balance) (stx-get-balance (as-contract tx-sender)))
(define-read-only (get-user-lp (market-id uint) (user principal))
    (default-to u0 (map-get? lp-positions { market-id: market-id, user: user }))
)
(define-read-only (get-contract-stx-balance) (stx-get-balance (as-contract (var-get contract-owner))))
(define-read-only (get-is-paused) (var-get contract-paused))