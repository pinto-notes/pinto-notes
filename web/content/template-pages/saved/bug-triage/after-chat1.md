Bug triage

Every bug report in one table, with how much it hurts. Paste a report into your AI and it files it.

## Bugs
<!-- pane-table: Bug=text; Severity=choice P0|P1|P2|P3; Area=text; Status=choice New|Confirmed|In progress|Fixed|Won't fix; Reported=text; Link=text -->
| Bug | Severity | Area | Status | Reported | Link |
| --- | --- | --- | --- | --- | --- |
| Saved Visa fails at checkout | P2 | Web checkout | New | 2026-11-22 |  |

## Details
Steps to reproduce, what was expected and what happened. One section per bug.

### Saved Visa fails at checkout
**Steps:**
1. Go to web checkout.
2. Choose a saved Visa card to pay.

**Expected:** The payment goes through.
**What happened:** Checkout spins, then shows "Payment failed". Paying with a new card works. Reported by support, two customers so far.

## Severity
- **P0:** data loss, a security hole, or everyone is blocked. Drop everything.
- **P1:** a main flow is broken for many people. This week.
- **P2:** broken, but there's a workaround. Schedule it.
- **P3:** polish. When there's time.