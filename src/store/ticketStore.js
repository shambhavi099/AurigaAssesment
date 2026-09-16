import tickets from "../data/tickets.js";

const ticketStore = [...tickets];

export function getAllTickets() {
  return [...ticketStore];
}

export function getTicketById(id) {
  return ticketStore.find((ticket) => ticket.id === id) || null;
}

export function createTicket(ticket) {
  ticketStore.push(ticket);
  return ticket;
}

export function clearTickets() {
  ticketStore.length = 0;
}

export default {
  getAllTickets,
  getTicketById,
  createTicket,
  clearTickets
};