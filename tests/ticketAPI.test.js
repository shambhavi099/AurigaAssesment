import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../src/app.js";
import { clearTickets, createTicket } from "../src/store/ticketStore.js";

beforeEach(() => {
  clearTickets();

  createTicket({
    id: "T-001",
    customerName: "Acme Corp",
    priority: "urgent",
    responseDueAt: "2026-09-16T10:00:00.000Z",
    assignedTo: "Priya",
  });

  createTicket({
    id: "T-002",
    customerName: "Globex",
    priority: "normal",
    responseDueAt: "2026-09-16T23:00:00.000Z",
    assignedTo: "Rahul",
  });

  createTicket({
    id: "T-003",
    customerName: "Acme Corp",
    priority: "normal",
    responseDueAt: "2026-09-17T10:00:00.000Z",
    assignedTo: null,
  });
});

describe("Ticket API", () => {
  it("returns the ticket queue", async () => {
    const response = await request(app).get("/tickets");

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(3);
    expect(response.body.total).toBe(3);
    expect(response.body.pagination).toBeDefined();
  });

  it("filters tickets by customer name case-insensitively", async () => {
    const response = await request(app)
      .get("/tickets")
      .query({ customer: "acme corp" });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(
      response.body.tickets.every(
        (ticket) => ticket.customerName === "Acme Corp"
      )
    ).toBe(true);
  });

  it("filters tickets by assignee", async () => {
    const response = await request(app)
      .get("/tickets")
      .query({ assignedTo: "priya" });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.tickets[0].assignedTo).toBe("Priya");
  });

  it("filters overdue tickets", async () => {
    const response = await request(app)
      .get("/tickets")
      .query({ overdue: "true" });

    expect(response.status).toBe(200);
    expect(response.body.tickets.every((ticket) => ticket.overdue)).toBe(true);
  });

  it("rejects an invalid overdue filter", async () => {
    const response = await request(app)
      .get("/tickets")
      .query({ overdue: "yes" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "overdue must be either true or false"
    );
  });

  it("supports pagination", async () => {
    const response = await request(app)
      .get("/tickets")
      .query({ page: 1, limit: 2 });

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.totalPages).toBe(2);
  });

  it("returns a single ticket by id", async () => {
    const response = await request(app).get("/tickets/T-001");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("T-001");
    expect(response.body.customerName).toBe("Acme Corp");
  });

  it("returns 404 for a missing ticket", async () => {
    const response = await request(app).get("/tickets/T-999");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Ticket not found");
  });

  it("creates a ticket", async () => {
    const response = await request(app)
      .post("/tickets")
      .send({
        customerName: "Initech",
        priority: "urgent",
        responseDueAt: "2026-09-18T10:00:00.000Z",
        assignedTo: "Priya",
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("T-004");
    expect(response.body.customerName).toBe("Initech");
    expect(response.body.priority).toBe("urgent");
    expect(response.body.assignedTo).toBe("Priya");
  });

  it("rejects invalid ticket creation data", async () => {
    const response = await request(app)
      .post("/tickets")
      .send({
        customerName: "",
        priority: "critical",
        responseDueAt: "not-a-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid ticket");
    expect(response.body.details.length).toBeGreaterThan(0);
  });

  it("updates ticket assignment", async () => {
    const response = await request(app)
      .patch("/tickets/T-003/assignment")
      .send({
        assignedTo: "Priya",
      });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toBe("Priya");
  });

  it("allows a ticket to be unassigned", async () => {
    const response = await request(app)
      .patch("/tickets/T-001/assignment")
      .send({
        assignedTo: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toBeNull();
  });

  it("rejects invalid assignment data", async () => {
    const response = await request(app)
      .patch("/tickets/T-001/assignment")
      .send({
        assignedTo: 123,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "assignedTo must be a string or null"
    );
  });
});