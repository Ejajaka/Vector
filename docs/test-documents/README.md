# Requirement review test document

Upload **`Northwind_Checkout_Orders_Requirements_v0.4.docx`** into the Requirement
Compiler. A Markdown copy is included for the same test.

The document is deliberately imperfect. It contains conflicting statements,
missing validation rules, unclear permissions, a dependency cycle and vague
wording so that every review surface has something to show.

## What the current engine extracts

| Surface | Count |
| --- | --- |
| Requirements | 51 |
| Functional | 47 |
| Non-functional | 4 |
| Review findings | 42 |
| Acceptance criteria | 94 |
| Suggestions | 80 |
| Graph | 82 nodes / 91 edges |
| Dependency cycles | 1 |

Counts can move when the extraction rules change. Treat them as a baseline, not
a hard assertion.

## What to check

### 1. Requirements and traceability
- The list has 51 statements grouped by document section.
- Each statement keeps its page, paragraph and character reference.
- Functional and non-functional requirements are separated (4 non-functional:
  encryption, retention, latency, accessibility/localization).
- Duplicate or malformed lines are dropped rather than duplicated.

### 2. Review findings
Open the review panel and confirm the three finding types appear:

- **Conflicts** (high): mandatory vs optional address, manual vs automatic save,
  public vs restricted checkout, desktop-only vs responsive, editable vs
  read-only profile.
- **Dependencies** (medium): the password reset, email verification, order
  submission and address-edit statements should link to their prerequisites.
- **Circular dependency** (critical): verify email → edit profile → sign in →
  verify email.
- **Ambiguities** (high/medium): validation rules unspecified, user permissions
  unclear, navigation target unclear, vague wording such as “modern and clean”
  and “user-friendly”.

For each finding, check the evidence quote, the affected requirement count and
the suggested clarification.

### 3. Acceptance criteria
- Criteria are written as Given / When / Then.
- Every criterion links back to a requirement code.
- Review actions work: approve, reject and request clarification.
- The export includes the linked requirement code and status.

### 4. Suggestions
- Edge cases appear for payments, uploads, empty tables, search, sessions and
  unauthorized access.
- Suggestions are tied to the requirement that triggered them.
- Accepting a suggestion creates or updates a requirement, and rejecting it
  removes it from the open list.

### 5. Graph and readiness
- Screens, components, roles and interactions appear as nodes.
- Dependency and conflict edges are visible.
- The circular dependency is highlighted.
- Readiness drops as findings remain unresolved.

## Files

- `Northwind_Checkout_Orders_Requirements_v0.4.docx` — primary upload.
- `Northwind_Checkout_Orders_Requirements_v0.4.pdf` — 6-page version; use this to
  check page references and page grouping.
- `Northwind_Checkout_Orders_Requirements_v0.4.md` — same content as Markdown.

Both DOCX and Markdown compile to 51 requirements on the current engine. The PDF
contains the same statements across six pages.
