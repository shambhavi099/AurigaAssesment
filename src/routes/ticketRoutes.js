import express from "express";

import {
  listTickets,
  getTicket,
  addTicket,
  updateAssignment
} from "../controllers/ticketController.js";

const router = express.Router();

router.get("/", listTickets);
router.post("/", addTicket);
router.patch("/:id/assignment", updateAssignment);
router.get("/:id", getTicket);

export default router;