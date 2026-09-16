const PRIORITY_RANK = {
  urgent: 0,
  normal: 1
};

export function isOverdue(ticket, now) {
  return new Date(ticket.responseDueAt).getTime() < new Date(now).getTime();
}

export function compareTickets(a, b, now) {
  const aOverdue = isOverdue(a, now);
  const bOverdue = isOverdue(b, now);

  // 1. Overdue tickets always come first.
  if (aOverdue !== bOverdue) {
    return aOverdue ? -1 : 1;
  }

  // 2. Urgent tickets come before normal tickets.
  const priorityDifference =
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  // 3. Earlier response deadline comes first.
  const deadlineDifference =
    new Date(a.responseDueAt).getTime() -
    new Date(b.responseDueAt).getTime();

  if (deadlineDifference !== 0) {
    return deadlineDifference;
  }

  // 4. Ticket ID provides deterministic ordering for exact ties.
  return a.id.localeCompare(b.id);
}

export function orderTickets(tickets, now = new Date()) {
  return [...tickets].sort((a, b) => compareTickets(a, b, now));
}

export function addOverdueStatus(tickets, now = new Date()) {
  return tickets.map((ticket) => ({
    ...ticket,
    overdue: isOverdue(ticket, now)
  }));
}