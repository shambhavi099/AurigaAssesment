import {
  getAllTickets,
  getTicketById,
  createTicket
} from "../store/ticketStore.js";

import {
  orderTickets,
  addOverdueStatus,
  isOverdue
} from "../services/ticketQueue.js";

const VALID_PRIORITIES = new Set(["urgent", "normal"]);

function validateTicket(ticket) {
  const errors = [];

  if (
    !ticket.customerName ||
    typeof ticket.customerName !== "string" ||
    !ticket.customerName.trim()
  ) {
    errors.push("customerName is required");
  }

  if (!ticket.priority || !VALID_PRIORITIES.has(ticket.priority)) {
    errors.push("priority must be either 'urgent' or 'normal'");
  }

  if (
    !ticket.responseDueAt ||
    Number.isNaN(Date.parse(ticket.responseDueAt))
  ) {
    errors.push("responseDueAt must be a valid date");
  }

  if (
    ticket.assignedTo !== undefined &&
    ticket.assignedTo !== null &&
    typeof ticket.assignedTo !== "string"
  ) {
    errors.push("assignedTo must be a string or null");
  }

  return errors;
}

function parsePagination(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return null;
  }

  return { page, limit };
}

export function listTickets(req, res) {
  const pagination = parsePagination(req.query);

  if (!pagination) {
    return res.status(400).json({
      error: "page must be >= 1 and limit must be between 1 and 100"
    });
  }

  const now = new Date();

  let tickets = getAllTickets();

  // Customer-name lookup: case-insensitive exact match.
  if (req.query.customer) {
    const customer = req.query.customer.trim().toLowerCase();

    tickets = tickets.filter(
      (ticket) => ticket.customerName.toLowerCase() === customer
    );
  }

  // Assignment filter.
  if (req.query.assignedTo) {
    const assignedTo = req.query.assignedTo.trim().toLowerCase();

    tickets = tickets.filter(
      (ticket) =>
        ticket.assignedTo &&
        ticket.assignedTo.toLowerCase() === assignedTo
    );
  }

  // Overdue filter.
  if (req.query.overdue !== undefined) {
    if (req.query.overdue !== "true" && req.query.overdue !== "false") {
      return res.status(400).json({
        error: "overdue must be either true or false"
      });
    }

    const shouldBeOverdue = req.query.overdue === "true";

    tickets = tickets.filter(
    (ticket) => isOverdue(ticket, now) === shouldBeOverdue
    );
  }

  // Queue ordering is performed by the backend.
  tickets = orderTickets(tickets, now);

  // Add calculated overdue information for the frontend.
  tickets = addOverdueStatus(tickets, now);

  const total = tickets.length;
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const paginatedTickets = tickets.slice(start, start + limit);

  res.json({
    tickets: paginatedTickets,
    total,
    pagination: {
      page,
      limit,
      totalPages
    }
  });
}

export function getTicket(req, res) {
  const ticket = getTicketById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  const now = new Date();

  res.json({
    ...ticket,
    overdue: isOverdue(ticket, now)
  });
}

export function addTicket(req, res) {
  const errors = validateTicket(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid ticket",
      details: errors
    });
  }

  const existingTickets = getAllTickets();

  const nextNumber =
    existingTickets.reduce((max, ticket) => {
      const match = /^T-(\d+)$/.exec(ticket.id);

      if (!match) {
        return max;
      }

      return Math.max(max, Number(match[1]));
    }, 0) + 1;

  const ticket = {
    id: `T-${String(nextNumber).padStart(3, "0")}`,
    customerName: req.body.customerName.trim(),
    priority: req.body.priority,
    responseDueAt: new Date(req.body.responseDueAt).toISOString(),
    assignedTo:
      req.body.assignedTo === undefined || req.body.assignedTo === ""
        ? null
        : req.body.assignedTo.trim()
  };

  createTicket(ticket);

  res.status(201).json({
    ...ticket,
    overdue: isOverdue(ticket, new Date())
  });
}

export function updateAssignment(req, res) {
  const ticket = getTicketById(req.params.id);

  if (!ticket) {
    return res.status(404).json({
      error: "Ticket not found"
    });
  }

  if (
    !Object.prototype.hasOwnProperty.call(req.body, "assignedTo") ||
    (req.body.assignedTo !== null &&
      typeof req.body.assignedTo !== "string")
  ) {
    return res.status(400).json({
      error: "assignedTo must be a string or null"
    });
  }

  ticket.assignedTo =
    req.body.assignedTo === null
      ? null
      : req.body.assignedTo.trim() || null;

  const now = new Date();

  res.json({
    ...ticket,
    overdue: isOverdue(ticket, now)
  });
}