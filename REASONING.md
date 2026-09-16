REASONING.md

1. Problem Understanding

The assessment is to build a generic helpdesk ticket queue for a helpdesk operator who needs to consistently select the most pressing ticket next.

The important part of the problem is not simply displaying tickets. The central requirement is the queue ordering rule:

Tickets that are already overdue must move to the front.

Within the same overdue/non-overdue group, urgent tickets should come before normal tickets.

Within the same priority, the ticket with the earlier response deadline should come first.

The ordering should be deterministic so that tickets with otherwise equal values do not move unpredictably.

The system also needs to support:

viewing tickets in queue order;

filtering overdue tickets;

filtering tickets assigned to a particular person;

finding tickets for a specific customer by name;

pagination for a large ticket list;

assigning and unassigning tickets;

creating and retrieving tickets;

validation of ticket input.

The implementation was intentionally kept generic rather than hard-coding the application around Priya or a two-person helpdesk.

2. Requirements and Assumptions

Explicit requirements derived from the problem

The ticket model needs:

an ID;

customer name;

priority;

agreed response deadline;

assignment information.

The queue needs:

overdue-first ordering;

priority-aware ordering;

deadline-aware ordering;

pagination;

overdue filtering;

assignee filtering;

customer lookup.

Reasonable assumptions

The problem does not require authentication, a complex database, real-time collaboration, or a large enterprise architecture. Therefore, these were not introduced.

The two priority levels described by the problem were represented as:

urgent

normal

A ticket is considered overdue when its responseDueAt is earlier than the current time. A ticket exactly at its deadline is not considered overdue.

Customer and assignee filters are case-insensitive to make lookup more practical.

3. Technology Choice

The project uses a small JavaScript full-stack implementation.

Backend

Node.js

Express

Vitest

Supertest

Frontend

React

Vite

Storage

A JSON file is used for ticket persistence.

This was chosen because the assessment is time-constrained and does not require database functionality. A JSON-backed store provides persistence without spending assessment time configuring an external database.

The architecture keeps storage behind a store layer, so a database could be introduced later without moving the queue-ordering logic into controllers or the frontend.

4. Architecture

The project is separated into a few focused layers:

React Frontend
      |
      v
REST API
      |
      v
Ticket Controller
      |
      +------------------+
      |                  |
      v                  v
Ticket Store       Queue Service
      |                  |
      v                  |
tickets.json             |
                         v
                 Deterministic ordering

Backend files

src/server.js starts the HTTP server.

src/app.js configures Express and routes.

src/routes/ticketRoutes.js defines ticket endpoints.

src/controllers/ticketController.js handles HTTP requests, validation, filtering and pagination.

src/services/ticketQueue.js contains the core queue ordering logic.

src/store/ticketStore.js handles ticket persistence.

src/data/tickets.json contains the persisted ticket data.

src/data/tickets.js provides the initial ticket data.

The separation is deliberate: the queue rules should not be mixed into HTTP or UI code.

5. Core Queue Ordering Reasoning

The queue ordering is the heart of the application.

The comparator first determines whether each ticket is overdue.

Overdue
   ↓
Priority
   ↓
Response deadline
   ↓
Ticket ID

Step 1: Overdue status

If one ticket is overdue and another is not, the overdue ticket comes first.

This directly implements the requirement that anything past its promised response time should jump to the front.

Step 2: Priority

If both tickets have the same overdue status, priority is compared.

The ranking is:

urgent = 0
normal = 1

Therefore urgent tickets sort before normal tickets.

Step 3: Response deadline

If priority is also equal, the earlier response deadline comes first.

This gives the queue a useful urgency ordering even when two tickets have the same priority.

Step 4: Deterministic tie-breaker

If two tickets have the same overdue status, priority and deadline, their IDs are compared.

This makes the ordering deterministic instead of depending on the original array order.

6. Why Ordering Happens Before Pagination

Filtering and pagination are implemented around the queue ordering rather than independently of it.

The general flow is:

Get tickets
   ↓
Apply filters
   ↓
Order by queue rules
   ↓
Add overdue status
   ↓
Calculate pagination
   ↓
Return requested page

Ordering before pagination is important.

If pagination happened before sorting, page 1 could contain tickets that are not actually the most pressing tickets in the entire queue.

The user should always see the correct highest-priority tickets on the first page.

7. Queue Service Design

The queue logic is isolated in:

src/services/ticketQueue.js

The main functions are:

isOverdue()

compareTickets()

orderTickets()

addOverdueStatus()

This makes the most important business rule independently testable.

orderTickets() also works on a copy of the input array, preventing the original ticket collection from being unexpectedly mutated.

8. Filtering and Customer Lookup

The API supports filters for:

customer;

assigned person;

overdue status.

Customer and assignee matching is case-insensitive.

For example, searching for:

Acme Corp

can match the same customer regardless of capitalization.

The overdue filter accepts explicit boolean values:

overdue=true
overdue=false

Invalid values are rejected instead of silently producing an unexpected result.

9. Pagination

The ticket list supports:

?page=1&limit=6

The API returns:

the tickets for the requested page;

total ticket count;

current page;

page size;

total number of pages.

Pagination is applied after filtering and ordering so the UI represents the actual queue rather than an arbitrary slice of the data.

The frontend provides next/previous navigation and displays the queue position for tickets shown on the current page.

10. Assignment

The application supports assigning a ticket to a person and removing an assignment.

The endpoint is:

PATCH /tickets/:id/assignment

The API validates that assignedTo is either a string or null.

Using null for an unassigned ticket keeps the data model explicit instead of using multiple representations such as empty strings or missing fields.

11. Ticket Creation and Validation

The application supports:

POST /tickets

Required ticket information is validated before creation.

Validation checks:

customer name is present;

priority is either urgent or normal;

response deadline is a valid date;

assignment is either a string or null.

Ticket IDs are generated sequentially from the existing ticket IDs.

The frontend also prevents selecting a deadline earlier than the current time through the datetime input.

The backend remains responsible for validation as the authoritative layer, because frontend validation alone can always be bypassed by an API client.

12. Ticket Retrieval

A specific ticket can be retrieved through:

GET /tickets/:id

A missing ticket returns HTTP 404 rather than an empty success response.

The response also includes the current overdue status.

13. Persistence Decision

The initial implementation used an in-memory store because it was the simplest way to get the queue working quickly.

During final review, persistence became useful because newly created tickets should not disappear when the backend process restarts.

A JSON-backed store was therefore used:

src/data/tickets.json

The store reads tickets from the file and writes the updated collection after ticket creation or assignment changes.

This provides simple persistence while avoiding the setup and complexity of an external database that was not required by the assessment.

14. Frontend Design

The frontend is intentionally focused on demonstrating the queue rather than adding unrelated functionality.

It provides:

queue display;

priority indicators;

overdue indicators;

deadline display;

queue position;

customer filter;

assignee filter;

overdue filter;

pagination;

create-ticket form;

assignment update;

refresh behaviour.

The frontend does not implement its own competing queue sort.

Instead, it requests the API's ordered result. This keeps the business rule in one place and prevents the frontend and backend from developing inconsistent ordering rules.

The frontend also periodically refreshes the queue so that overdue status can change as time passes.

15. API Design

The main endpoints are:

GET    /health
GET    /tickets
GET    /tickets/:id
POST   /tickets
PATCH  /tickets/:id/assignment

The API is intentionally small because the assessment focuses on queue behaviour rather than building a complete ITSM platform.

16. Testing Strategy

Testing focused first on the most important business rule and then on the API behaviour.

Queue tests

The queue tests cover:

overdue before non-overdue;

urgent before normal among overdue tickets;

urgent before normal among on-time tickets;

earlier deadline before later deadline;

deterministic ID tie-breaking;

exact deadline not being overdue;

a ticket becoming overdue after its deadline;

the input array not being mutated.

API tests

The API tests cover:

retrieving the queue;

customer filtering;

assignee filtering;

overdue filtering;

invalid overdue filter input;

pagination;

retrieving a ticket by ID;

404 for a missing ticket;

creating a ticket;

rejecting invalid ticket data;

updating assignment;

unassigning a ticket;

rejecting invalid assignment data.

Final test result:

Test Files  2 passed (2)
Tests       21 passed (21)

The frontend production build was also verified successfully with Vite.

17. Edge Cases Considered

Important edge cases include:

overdue versus non-overdue tickets;

a ticket exactly at its deadline;

multiple tickets with the same priority;

multiple tickets with the same deadline;

missing assignments;

invalid priority values;

invalid dates;

invalid pagination values;

invalid overdue filter values;

nonexistent ticket IDs;

empty assignment values;

case differences in customer and assignee searches.

These cases were handled through either the queue service or API validation rather than relying on frontend behaviour.

18. Development and Debugging Process

The implementation followed a progressive approach:

Understand requirements
        ↓
Inspect repository/environment
        ↓
Choose minimal stack
        ↓
Implement queue logic
        ↓
Implement REST API
        ↓
Add tests
        ↓
Build React frontend
        ↓
Connect frontend to API
        ↓
Test manually
        ↓
Fix runtime/integration issues
        ↓
Add validation and queue-position feedback
        ↓
Verify persistence
        ↓
Run final tests and production build

When the frontend initially showed a 404, the issue was traced to the backend API not running rather than a problem with the React implementation. The frontend Vite proxy expects the backend to be available on port 3000.

The final automated test suite and production build both passed.

19. Design Trade-offs

JSON storage instead of a database

Benefit: very small setup and persistent data.

Trade-off: JSON file storage is not appropriate for concurrent production workloads or a large multi-user helpdesk.

For this assessment, simplicity and reliability within the available time were more important.

Backend-owned sorting

Benefit: one source of truth for the queue rule.

Trade-off: the frontend depends on the API returning the correct order.

This is intentional because the queue ordering is business logic and belongs on the backend.

Small architecture

Benefit: fewer moving parts and faster debugging.

Trade-off: the project does not include enterprise features such as authentication, role management, database transactions, audit systems or real-time sockets.

Those features were not required by the stated assessment.

20. Scope Discipline

The implementation deliberately avoided adding requirements that were not stated.

Examples of functionality intentionally not introduced:

authentication;

complex authorization;

external database configuration;

ticket descriptions;

unnecessary third-party services;

complicated state management;

real-time sockets;

unrelated helpdesk features.

This kept the implementation focused on the actual assessment goal: getting tickets and queue order right first, followed by filters, assignment, pagination and supporting operations.

21. Final Result

The completed application provides a generic helpdesk ticket queue where the most pressing ticket is consistently surfaced according to deterministic business rules.

The core rule is:

OVERDUE
   ↓
URGENT / NORMAL
   ↓
EARLIEST DEADLINE
   ↓
TICKET ID

The final implementation includes:

deterministic queue ordering;

overdue detection;

customer lookup;

assignment filtering and updates;

overdue filtering;

pagination;

ticket creation;

ticket retrieval;

validation;

persistent JSON storage;

React frontend;

automated backend/API tests;

production frontend build.

The final verification completed with 21 automated tests passing and a successful Vite production build.