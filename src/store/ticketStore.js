import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "../data/tickets.json");

function readTickets() {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function writeTickets(tickets) {
  fs.writeFileSync(dataFile, JSON.stringify(tickets, null, 2));
}

export function getAllTickets() {
  return readTickets();
}

export function getTicketById(id) {
  return readTickets().find((ticket) => ticket.id === id) || null;
}

export function createTicket(ticket) {
  const tickets = readTickets();
  tickets.push(ticket);
  writeTickets(tickets);
  return ticket;
}

export function clearTickets() {
  writeTickets([]);
}

export default {
  getAllTickets,
  getTicketById,
  createTicket,
  clearTickets,
};
