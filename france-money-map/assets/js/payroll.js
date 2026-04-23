export const SCENARIO_META = [
  { id: "low", label: "Bas" },
  { id: "stable", label: "Stable" },
  { id: "max", label: "Max plausible" },
];

export function applyScenarioPreset(rule, scenarioId, currentState = {}) {
  const preset = rule.scenarioPresets[scenarioId] || rule.scenarioPresets.stable;
  return {
    scenario: scenarioId,
    gdDays: preset.gdDays,
    panierDays: preset.panierDays,
    nightShifts: preset.nightShifts,
    weekendShifts: preset.weekendShifts,
    overtimeHours: preset.overtimeHours,
    zone: preset.zone,
    riskEnabled: preset.riskEnabled,
    livingCost:
      currentState.livingCost !== undefined
        ? currentState.livingCost
        : rule.livingCostDefault,
  };
}

export function createPayrollState(rule, scenarioId = "stable") {
  return applyScenarioPreset(rule, scenarioId);
}

export function calculatePayroll(rule, state) {
  const zoneRate =
    state.zone === "paris"
      ? rule.mobility.parisDaily
      : rule.mobility.provinceDaily;
  const baseNetEstimate = rule.baseGrossMonthly * rule.netRatio;
  const nightBonus = state.nightShifts * rule.allowances.nightPerShiftNet;
  const weekendBonus = state.weekendShifts * rule.allowances.weekendPerShiftNet;
  const overtimeBonus = state.overtimeHours * rule.allowances.overtimePerHourNet;
  const grandDeplacementBonus = state.gdDays * zoneRate;
  const panierBonus = state.panierDays * rule.allowances.panierPerDayNet;
  const riskBonus = state.riskEnabled
    ? rule.allowances.environmentMonthlyNet
    : 0;
  const totalEstimatedNet =
    baseNetEstimate +
    nightBonus +
    weekendBonus +
    overtimeBonus +
    grandDeplacementBonus +
    panierBonus +
    riskBonus;
  const pocketAfterLiving = Math.max(0, totalEstimatedNet - state.livingCost);

  return {
    baseNetEstimate: Math.round(baseNetEstimate),
    nightBonus: Math.round(nightBonus),
    weekendBonus: Math.round(weekendBonus),
    overtimeBonus: Math.round(overtimeBonus),
    grandDeplacementBonus: Math.round(grandDeplacementBonus),
    panierBonus: Math.round(panierBonus),
    riskBonus: Math.round(riskBonus),
    totalEstimatedNet: Math.round(totalEstimatedNet),
    pocketAfterLiving: Math.round(pocketAfterLiving),
    livingCost: Math.round(state.livingCost),
  };
}
