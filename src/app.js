import express from "express";
import ticketRoutes from "./routes/ticketRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Support Queue API is running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/tickets", ticketRoutes);

export default app;