# Support Queue

A helpdesk ticket management application built for the AI-assisted coding assessment.

The main goal of the application is to ensure that the **most pressing ticket always appears first** according to a deterministic queue-ordering rule.

---

## Problem

A helpdesk receives tickets with different priorities and response deadlines.

The system needs to help the support team quickly identify which ticket should be handled next while also making it easy to:

- view the ticket queue;
- identify overdue tickets;
- find tickets assigned to a particular person;
- find tickets for a particular customer;
- paginate through a large ticket list;
- assign and unassign tickets;
- create and retrieve tickets.

The queue ordering is the core business rule of the application.

---

## Queue Ordering

Tickets are ordered using the following rules:

```text
Overdue
   ↓
Priority
   ↓
Response Deadline
   ↓
Ticket ID