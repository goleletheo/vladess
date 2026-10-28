# Aviator Predictor Analytics

Responsive Next.js prototype for entering completed multipliers, producing exploratory model estimates, and tracking target outcomes.

## Requirements
- Node.js 20.9+ recommended
- npm

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Production build
```bash
npm run build
npm start
```

## Important modelling note
The output is an experimental statistical estimate, not a reliable prediction of the next crash. The exponential distribution is an unvalidated assumption; the data-stability score is not probability of forecast correctness. This prototype stores its data in React state and resets on refresh. It does not connect to Aviator or place bets.

## Main files
- `app/page.tsx`: responsive dashboard and history log
- `lib/forecast.ts`: moving average + exponential baseline
- `app/globals.css`: Tailwind v4 import and global styling
- `app/layout.tsx`: metadata and root layout
