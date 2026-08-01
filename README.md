# Portfolio — Md. Maruf Ahmed

Frontend developer who thinks like a network engineer.

**Live:** https://maruf-ahmed-dev.netlify.app/

A personal portfolio in two halves: frontend case studies on one side,
CCNA lab notes and an interactive network terminal on the other.

## Stack

React 18 · Vite 6 · Tailwind CSS 4 · React Router 7 · Framer Motion

## Environment

One variable, `VITE_WEB3FORMS_KEY`, powers the contact form — see
`.env.example` for how to get one. Without it the form falls back to
opening the visitor's mail app.

## Structure

```
src/
  components/   ui, layout, sections, terminal, network
  pages/        routes
  data/         profile, projects, notes — edit content here, not in components
  hooks/
  styles/
```
