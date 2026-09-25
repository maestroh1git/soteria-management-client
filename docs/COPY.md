# How the product talks

The wording rules every screen follows (ROADMAP-EXECUTION.md, C3.7). Words are
part of the interface: a button that says "Submit" on one screen and "Save" on
the next, for the same thing, makes people read every button twice.

## Buttons

- **A verb, and what it acts on.** "Add department", "Record a payment",
  "Bill the term". Not "Submit", "OK", "Create".
- **Sentence case.** "New loan", not "New Loan".
- **The dialog's button repeats its title's verb.** Title "Add a department",
  button "Add department". An edit is "Save changes".
- **Cancel is always "Cancel"**, on the left of the action.
- **A destructive button names the thing destroyed:** "Delete department",
  "Void receipt". Never a bare "Delete" or "Confirm".

## Dialogs

- The title asks or states, specifically: "Delete Mathematics?" not "Are you
  sure?".
- The description says what happens and what cannot be undone, in one or two
  sentences, and offers the gentler alternative if there is one ("To stop
  using it but keep its history, deactivate it instead.").
- Use `FormDialog` (components/common/form-dialog) for any short form. It
  keeps the dialog open while saving and shows the API's refusal on the field
  it is about.

## Toasts

- **Success: the thing, then what happened, past tense, no exclamation mark.**
  "Department added", "Receipt voided", "Payroll approved for 42 staff".
- **Written once, in the mutation hook**, so the same change reads the same
  wherever it is made. Screens do not write their own success toasts.
- **Failure: what could not be done, and why if the API said.** "That could
  not be saved. Please try again." is the fallback, not the norm. Errors from
  a form go on the form, not in a toast.
- Never show a developer's message ("Request failed with status code 403").
  `getApiErrorMessage` exists so nothing unnormalised reaches a person.

## Empty states

- **Say which kind of empty it is.** "No loans" (nothing yet) is different
  from "No loans match" (the filters hid them) and from "Couldn't load the
  loans" (it failed — `EmptyState` with `isError`).
- Nothing yet: say what fills it and offer the action if they may take it.
- Filtered: suggest the way out ("Try another status or search.").

## Filters and search

- Every list someone works from has a search box and a filter per thing
  people sort that list by: its status (from the status registry), the
  record it belongs to (class, position, account, pay run), and its kind.
- The select reads "All statuses", "All classes": plural, lower case.
- Search placeholders say what is searched: "Pupil, admission no. or
  guardian", not "Search…".
- A paged list searches on the server; a whole list searches in the page.

## Words

| Say | Not | Why |
|---|---|---|
| Staff, member of staff | Employee (in prose) | "Employee" stays as the record's name in the sidebar |
| Position | Role (for a job) | "Role" is someone's access: Admin, Approver |
| Access | Permissions, roles (in prose) | What people understand the Team tab to change |
| Pupil (school screens), Student (records, reports) | Kid, child (except to parents) | See the glossary, lib/copy/glossary.ts |
| Guardian | Parent (in records) | Not every guardian is a parent |
| Educator | Teacher (as a job role) | The position name schools use; "form teacher" for a class's own |
| Awaiting approval | Pending | Says whose move it is |
| Receipt | Payment (the record) | What the family is handed |
| Pay run | Payroll (a single one) | "Payroll" is the whole area |

## People

- **In a list of people** (a table, a register, a roster, a picker, a grid):
  surname first, "Adeyemi, Tobi", and the list sorted by surname
  (`listName`, `bySurname` in `lib/utils/names.ts`).
- **In a title or a sentence:** "Tobi Adeyemi" (`fullName`).
- **Every name is a way in.** A person shown in a list links to their record
  with `StudentLink` / `EmployeeLink`, which fall back to plain text for
  someone who may not open it.
- **Search matches either order** and part of a name: "tobi adeyemi",
  "adeyemi tobi", "adey". On the API, `whereWordsMatch`; in a DataTable,
  `nameSearchText`.
- **Copying something** (a link, a number) uses `CopyButton`, which says
  "Copied".

## Numbers and dates

- Money through `<Money>` or `formatMoney`: the tenant's currency, sign
  outside the symbol (-₦1,000.00), a true minus for deductions (−₦5,000.00).
- Dates through lib/utils/dates, in one of six styles (see the top of that
  file). Never `toLocaleDateString`; the linter refuses it.
