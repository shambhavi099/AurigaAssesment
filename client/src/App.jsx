import { useEffect, useState } from "react";
import {
  createTicket,
  fetchTickets,
  updateAssignment,
} from "./api";
import "./App.css";

const EMPTY_FORM = {
  customerName: "",
  priority: "normal",
  responseDueAt: "",
  assignedTo: "",
};

function formatDeadline(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TicketCard({ ticket, queuePosition, onAssignmentSaved }) {
  const [assignee, setAssignee] = useState(ticket.assignedTo || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAssignment() {
    setSaving(true);
    setMessage("");

    try {
      await updateAssignment(ticket.id, assignee.trim() || null);
      setMessage("Saved");
      onAssignmentSaved();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={`ticket-card ${ticket.overdue ? "is-overdue" : ""}`}>
      <div className="queue-position">
        #{queuePosition}
      </div>
      <div className="ticket-top">
        <div>
          <span className="ticket-id">{ticket.id}</span>
          <h3>{ticket.customerName}</h3>
        </div>

        <span className={`priority ${ticket.priority}`}>
          {ticket.priority}
        </span>
      </div>

      <div className="ticket-details">
        <div>
          <span className="detail-label">Response deadline</span>
          <strong>{formatDeadline(ticket.responseDueAt)}</strong>
        </div>

        <div>
          <span className="detail-label">SLA status</span>
          <strong className={ticket.overdue ? "overdue-text" : "on-time-text"}>
            {ticket.overdue ? "Overdue" : "On time"}
          </strong>
        </div>
      </div>

      <div className="assignment">
        <label htmlFor={`assignment-${ticket.id}`}>Assigned to</label>

        <div className="assignment-row">
          <input
            id={`assignment-${ticket.id}`}
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="Leave empty for unassigned"
          />

          <button onClick={handleAssignment} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {message && <small className="assignment-message">{message}</small>}
      </div>
    </article>
  );
}

function App() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    totalPages: 0,
  });

  const [customerInput, setCustomerInput] = useState("");
  const [assignedInput, setAssignedInput] = useState("");
  const [overdueInput, setOverdueInput] = useState("");

  const [filters, setFilters] = useState({
    customer: "",
    assignedTo: "",
    overdue: "",
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchTickets({
        ...filters,
        page,
        limit: 6,
      });

      setTickets(data.tickets);
      setTotal(data.total);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  loadTickets();

  const refreshInterval = setInterval(() => {
    loadTickets();
  }, 60000);

  return () => clearInterval(refreshInterval);
}, [filters, page]);

  function handleSearch(event) {
    event.preventDefault();

    setPage(1);
    setFilters({
      customer: customerInput,
      assignedTo: assignedInput,
      overdue: overdueInput,
    });
  }

  function resetFilters() {
    setCustomerInput("");
    setAssignedInput("");
    setOverdueInput("");
    setPage(1);
    setFilters({
      customer: "",
      assignedTo: "",
      overdue: "",
    });
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setCreateMessage("");

    try {
      await createTicket({
        customerName: form.customerName,
        priority: form.priority,
        responseDueAt: new Date(form.responseDueAt).toISOString(),
        assignedTo: form.assignedTo.trim() || null,
      });

      setForm(EMPTY_FORM);
      setCreateMessage("Ticket created successfully.");
      setShowCreateForm(false);
      setPage(1);
      await loadTickets();
    } catch (err) {
      setCreateMessage(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <p className="eyebrow">HELPDESK OPERATIONS</p>
          <h1>Support Queue</h1>
          <p className="subtitle">
            The most pressing ticket is always surfaced first.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setShowCreateForm((current) => !current);
            setCreateMessage("");
          }}
        >
          {showCreateForm ? "Close form" : "+ New ticket"}
        </button>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>Total tickets</span>
          <strong>{total}</strong>
        </div>

        <div className="stat-card">
          <span>Current page</span>
          <strong>
            {pagination.page} / {pagination.totalPages || 1}
          </strong>
        </div>

        <div className="stat-card">
          <span>Queue rule</span>
          <strong>Overdue → Priority → Deadline</strong>
        </div>
      </section>

      {showCreateForm && (
        <section className="panel create-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CREATE</p>
              <h2>New support ticket</h2>
            </div>
          </div>

          <form className="create-form" onSubmit={handleCreate}>
            <label>
              Customer name
              <input
                required
                value={form.customerName}
                onChange={(event) =>
                  updateForm("customerName", event.target.value)
                }
                placeholder="e.g. Acme Corp"
              />
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) =>
                  updateForm("priority", event.target.value)
                }
              >
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
              </select>
            </label>

            <label>
              Response deadline
              <input
                required
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={form.responseDueAt}
                onChange={(event) =>
                  updateForm("responseDueAt", event.target.value)
                }
              />
            </label>

            <label>
              Assigned to
              <input
                value={form.assignedTo}
                onChange={(event) =>
                  updateForm("assignedTo", event.target.value)
                }
                placeholder="Optional"
              />
            </label>

            <button className="primary-button" disabled={creating}>
              {creating ? "Creating..." : "Create ticket"}
            </button>
          </form>

          {createMessage && (
            <p className="form-message">{createMessage}</p>
          )}
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">QUEUE</p>
            <h2>Ticket queue</h2>
          </div>

          <button className="secondary-button" onClick={loadTickets}>
            Refresh
          </button>
        </div>

        <form className="filters" onSubmit={handleSearch}>
          <label>
            Customer
            <input
              value={customerInput}
              onChange={(event) => setCustomerInput(event.target.value)}
              placeholder="Search customer"
            />
          </label>

          <label>
            Assigned to
            <input
              value={assignedInput}
              onChange={(event) => setAssignedInput(event.target.value)}
              placeholder="Agent name"
            />
          </label>

          <label>
            SLA status
            <select
              value={overdueInput}
              onChange={(event) => setOverdueInput(event.target.value)}
            >
              <option value="">All tickets</option>
              <option value="true">Overdue</option>
              <option value="false">On time</option>
            </select>
          </label>

          <button className="primary-button" type="submit">
            Apply filters
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading queue...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            No tickets match the current filters.
          </div>
        ) : (
          <div className="ticket-list">
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                queuePosition={(page - 1) * 6 + index + 1}
                onAssignmentSaved={loadTickets}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="secondary-button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              ← Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              className="secondary-button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
