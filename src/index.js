import { startDashboardFit } from "./ha-dashboard-fit.js";

window.haDashboardFit?.disconnect?.();
window.haDashboardFit = startDashboardFit();
