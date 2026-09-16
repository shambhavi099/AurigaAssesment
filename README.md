# Support Queue

A helpdesk ticket queue designed to ensure that the most pressing support ticket is always surfaced first.

The application provides ticket creation and retrieval, deterministic queue ordering, overdue tracking, customer and assignee filtering, assignment updates, and pagination.

## Phase 1 Scope

The first phase implements the core helpdesk workflow described in the assessment:

- Create support tickets
- Retrieve individual tickets
- Retrieve the ordered support queue
- Prioritize overdue tickets
- Prioritize urgent tickets over normal tickets
- Order tickets by earliest response deadline
- Search tickets by customer name
- Filter tickets by assigned agent
- Filter tickets by overdue/on-time status
- Assign or unassign tickets
- Paginate large ticket lists
- Validate incoming ticket data
- Automatically refresh the queue periodically in the frontend

The queue ordering is handled by the backend so that all clients receive the same deterministic ordering.

---

## Tech Stack

### Backend

- Node.js
- Express
- JavaScript (ES Modules)
- Vitest
- Supertest

### Frontend

- React
- Vite
- JavaScript
- Native Fetch API
- CSS

### Storage

Phase 1 uses an in-memory ticket store.

No external database or authentication layer is required by the current assessment requirements.

---

## Project Structure

```text
AurigaAssesment/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   │   └── ticketController.js
│   ├── data/
│   │   └── tickets.js
│   ├── routes/
│   │   └── ticketRoutes.js
│   ├── services/
│   │   └── ticketQueue.js
│   └── store/
│       └── ticketStore.js
├── tests/
│   └── ticketQueue.test.js
├── client/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
├── package-lock.json
├── README.md
├── REASONING.md
└── AI_LOGS.md