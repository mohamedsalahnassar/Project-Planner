# Project Planner

A simple project planning tool packaged as a desktop application using [Electron](https://electronjs.org/).

## Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/)

## Install dependencies
```bash
npm install
```

## Run in development
Launch the Electron app for development without creating installers:
```bash
npm start
```

## Run tests
```bash
npm test
```

## Build distributable installers
Generate macOS and Windows packages in the `dist/` folder:
```bash
npm run dist
```
Electron Builder will create `.dmg` and `.exe` installers. Building Windows installers on non-Windows systems requires
[Wine](https://www.winehq.org/) to be available on your machine.

## Directory structure
- `Project_Planner_App.html` – Main HTML entry
- `assets/` – static assets used by the app
- `electron/` – Electron main and preload scripts

## Notes
When packaging, scripts and styles referenced from `Project_Planner_App.html` use relative paths so that they load correctly.

