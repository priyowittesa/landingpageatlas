/**
 * Every threshold the prototype applies, in one place. Selectors, labels,
 * metric definitions and tests read these; no screen types a threshold by hand.
 */

/** Requirements, table 3.4.4: more than 10 points behind plan raises an early warning. */
export const DEVIATION_ALERT_PTS = 10;
/** Assumption (not in the requirements): this far behind plan rates a project at risk, not just watch. */
export const DEVIATION_CRITICAL_PTS = 25;
/** Requirements, table 3.4.4: a critical item is more than 20 points behind plan. */
export const CRITICAL_ITEM_LAG_PTS = 20;
/** Requirements, table 3.4.4: a completion invoice more than 30 days overdue. */
export const OVERDUE_ALERT_DAYS = 30;
/** Requirements, table 3.4.4: Retensi held more than 180 days. */
export const RETENTION_ALERT_DAYS = 180;
