/**
 * Deal Velocity Score
 * 0–100: decays by ~10 pts/day if not contacted. Resets to 100 on call.
 */

function daysSince(timestamp) {
  if (!timestamp) return 0;
  const now = Date.now();
  const t = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  return Math.max(0, (now - t) / (1000 * 60 * 60 * 24));
}

export function getVelocityScore(lead, actioned = []) {
  const calls = actioned.filter(
    (a) => (a.leadId === lead.id || a.id === lead.id) &&
            (a.action === "right" || a.type === "called")
  ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (calls.length > 0) {
    const daysSinceCall = daysSince(calls[0].timestamp);
    return Math.max(0, Math.round(100 - daysSinceCall * 10));
  }

  // Never called — decay from when lead was added
  const addedAt = lead.addedAt || lead.created_at;
  if (addedAt) {
    return Math.max(0, Math.round(100 - daysSince(addedAt) * 8));
  }

  return 80; // Default for brand-new leads
}

export function velocityColour(score) {
  if (score >= 80) return "#3B82F6"; // Blue — fresh
  if (score >= 50) return "#F59E0B"; // Amber — cooling
  return "#EF4444";                  // Red — cold
}

export function velocityLabel(score) {
  if (score >= 80) return "fresh";
  if (score >= 50) return "cooling";
  return "cold";
}
