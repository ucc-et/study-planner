# study-planner

A small Next.js app for students who want a clearer overview of their semester credit counts.

If you’ve ever tried to keep track of modules/courses and credit requirements in TU Darmstadt’s TUCaN and thought “there must be a better way”… this is that better way.

## What it does

The app models your study plan like this:

- **Section** (e.g. “Core”, “Electives”)
	- has a **title**
	- has **credit constraints**: min/max credits required
	- contains **Subsections**
- **Subsection** (e.g. “Math”, “CS Basics”)
	- has a **title**
	- has **credit constraints**: min/max credits required
	- contains an **EventList** (in Filling View)
- **Event** (a course/module)
	- **title**
	- **credit points**
	- can be marked **pending** (for courses you’re currently taking)

Constraints are validated live in Filling View so you immediately see what’s missing or what’s over the limit.

## Views

### 1) Template Editor

The template editor is used to define the structure of your studies:

- Add/remove **Sections** and **Subsections**
- Set credit constraints (min/max) for each Section/Subsection
- No events here (by design)

### 2) Filling View

Use this to fill your template with real courses:

- Add events under subsections
- Enter credits + mark events as **pending**
- See validation chips (OK / Constraint not met)
- See a “Section totals” panel at the top
- Collapse/expand sections to keep it readable

## Import / Export

There are two different kinds of exports:

- **Template**: exports only the structure (sections/subsections/constraints)
- **Values**: exports a single “plan” file that includes both:
	- the template, and
	- the filled events (credits + pending)

Tip: If you want to share your plan with someone, export **Values**.

Because this application does not store any data, the export is a conveniant way for a user to adjust their own grades or study structure later on.

## Run locally

Prerequisites:

- Node.js

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Then open:

- http://localhost:3000
