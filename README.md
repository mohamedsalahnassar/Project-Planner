# Project Planner

This project now integrates the [dhtmlxGantt](https://dhtmlx.com/docs/products/dhtmlxGantt/) library for
rendering project schedules. The Gantt chart supports drag and drop editing,
zooming and exporting directly to PDF or PNG.

## Development

Install dependencies and start a local web server:

```bash
npm install
npm start
```

Then open [http://localhost:8000/Project_Planner_App.html](http://localhost:8000/Project_Planner_App.html)
in your browser.

## Rendering the Gantt chart

`ui/gantt.js` exposes `renderGantt` which converts the `computeSchedule`
output into dhtmlxGantt tasks. It preserves lane colors and labels and links
tasks sequentially. The function can be supplied with a container element and
an optional callback for live updates.

Example:

```js
import { renderGantt } from './ui/gantt.js';

renderGantt(plan, aggr, efficiency, getPhase, startDate, {
  container: document.getElementById('gantt_here'),
  onTaskUpdate: (id, item) => console.log('updated', id, item)
});
```

The HTML page imports `dhtmlxgantt.css` and `dhtmlxgantt.js` from
`node_modules` so the library is available when serving the project.

