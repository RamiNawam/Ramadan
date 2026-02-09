# Ramadan Calendar

A beautiful, full-page calendar for the month of Ramadan (29 days) built with TypeScript.

## Features

- Full-page calendar display
- Light blue gradient background
- Automatically highlights the current day with a circle
- Crosses out past days
- 29 days of Ramadan starting on a Tuesday
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Serve the website:
```bash
npm run serve
```

Then open your browser to `http://localhost:8080`

## Configuration

To change the start date of Ramadan, edit `src/main.ts` and update the `RAMADAN_START_DATE` constant.

## Development

- `npm run build` - Compile TypeScript once
- `npm run watch` - Watch for changes and recompile automatically
- `npm run serve` - Start a local server
