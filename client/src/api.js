const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export async function fetchTickets({
  customer = "",
  assignedTo = "",
  overdue = "",
  page = 1,
  limit = 6,
} = {}) {
  const params = new URLSearchParams({
    page,
    limit,
  });

  if (customer.trim()) params.set("customer", customer.trim());
  if (assignedTo.trim()) params.set("assignedTo", assignedTo.trim());
  if (overdue) params.set("overdue", overdue);

  return request(`/tickets?${params.toString()}`);
}

export async function createTicket(ticket) {
  return request("/tickets", {
    method: "POST",
    body: JSON.stringify(ticket),
  });
}

export async function updateAssignment(id, assignedTo) {
  return request(`/tickets/${id}/assignment`, {
    method: "PATCH",
    body: JSON.stringify({ assignedTo }),
  });
}
