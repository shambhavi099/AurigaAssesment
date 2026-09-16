import { describe, expect, it } from "vitest";

import {
  isOverdue,
  orderTickets
} from "../src/services/ticketQueue.js";

const NOW = "2026-09-16T14:00:00.000Z";

function ticket(id, priority, responseDueAt) {
  return {
    id,
    customerName: `Customer ${id}`,
    priority,
    responseDueAt,
    assignedTo: null
  };
}

describe("ticket queue ordering", () => {
  it("puts overdue tickets before non-overdue tickets", () => {
    const tickets = [
      ticket("T-002", "urgent", "2026-09-16T16:00:00.000Z"),
      ticket("T-001", "normal", "2026-09-16T12:00:00.000Z")
    ];

    const ordered = orderTickets(tickets, NOW);

    expect(ordered.map((t) => t.id)).toEqual(["T-001", "T-002"]);
  });

  it("orders urgent before normal within the same overdue group", () => {
    const tickets = [
      ticket("T-002", "normal", "2026-09-16T12:00:00.000Z"),
      ticket("T-001", "urgent", "2026-09-16T13:00:00.000Z")
    ];

    const ordered = orderTickets(tickets, NOW);

    expect(ordered.map((t) => t.id)).toEqual(["T-001", "T-002"]);
  });

  it("orders urgent before normal when both are not overdue", () => {
    const tickets = [
      ticket("T-002", "normal", "2026-09-16T15:00:00.000Z"),
      ticket("T-001", "urgent", "2026-09-16T16:00:00.000Z")
    ];

    const ordered = orderTickets(tickets, NOW);

    expect(ordered.map((t) => t.id)).toEqual(["T-001", "T-002"]);
  });

  it("orders the same priority by earliest deadline", () => {
    const tickets = [
      ticket("T-002", "urgent", "2026-09-16T16:00:00.000Z"),
      ticket("T-001", "urgent", "2026-09-16T15:00:00.000Z")
    ];

    const ordered = orderTickets(tickets, NOW);

    expect(ordered.map((t) => t.id)).toEqual(["T-001", "T-002"]);
  });

  it("uses ticket id as a deterministic tie breaker", () => {
    const tickets = [
      ticket("T-002", "urgent", "2026-09-16T15:00:00.000Z"),
      ticket("T-001", "urgent", "2026-09-16T15:00:00.000Z")
    ];

    const ordered = orderTickets(tickets, NOW);

    expect(ordered.map((t) => t.id)).toEqual(["T-001", "T-002"]);
  });

  it("does not consider a ticket overdue exactly at its deadline", () => {
    const currentTicket = ticket(
      "T-001",
      "urgent",
      "2026-09-16T14:00:00.000Z"
    );

    expect(isOverdue(currentTicket, NOW)).toBe(false);
  });

  it("considers a ticket overdue after its deadline", () => {
    const overdueTicket = ticket(
      "T-001",
      "urgent",
      "2026-09-16T13:59:59.000Z"
    );

    expect(isOverdue(overdueTicket, NOW)).toBe(true);
  });

  it("does not mutate the original ticket array", () => {
    const tickets = [
      ticket("T-002", "normal", "2026-09-16T15:00:00.000Z"),
      ticket("T-001", "urgent", "2026-09-16T14:30:00.000Z")
    ];

    const originalIds = tickets.map((t) => t.id);

    orderTickets(tickets, NOW);

    expect(tickets.map((t) => t.id)).toEqual(originalIds);
  });
});