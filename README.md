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

Use this to design your degree/semester structure:

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

## Run locally

Prerequisites:

- Node.js (recommended: latest LTS)

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

Optional checks:

```bash
npm run lint
npm run build
```

## How it’s built

- Next.js App Router
- React
- Tailwind CSS (via the Tailwind v4 PostCSS import in `app/globals.css`)

## Notes

- The exported JSON files are meant to be human-readable.
- When importing “Values”, the app can also load older “values-only” JSON exports (backward compatible).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
