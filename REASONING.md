# REASONING — Phase 1

## 1. Understanding the Problem

The central requirement of the support queue is not simply to display tickets. The important part is deciding **which ticket should be handled next**.

From the problem statement, the helpdesk needs to:

- create and retrieve tickets
- identify the most pressing ticket
- move overdue tickets to the front
- respect ticket priority
- identify overdue tickets
- find tickets assigned to an agent
- find tickets for a specific customer
- handle a large number of tickets through pagination

The phrase that anything past its promised response time should jump to the front makes **queue ordering the core business rule**.

Because of that, the queue logic was treated as the most important part of the implementation and was kept separate from HTTP and UI code.

---

## 2. Core Queue Ordering

The queue is ordered using four deterministic rules:

1. Overdue tickets first
2. Urgent tickets before normal tickets
3. Earlier response deadline first
4. Ticket ID as the final tie-breaker

The resulting ordering is conceptually:

```text
Overdue urgent
Overdue normal
On-time urgent
On-time normal