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

function calculateOvertimeNet(rule, state) {
  const overtimeHours = Math.max(0, Number(state.overtimeHours) || 0);
  const hourlyGross = rule.baseGrossMonthly / 151.67;
  const firstBandHours = Math.min(8, overtimeHours);
  const secondBandHours = Math.max(0, overtimeHours - 8);
  const overtimeGross =
    firstBandHours * hourlyGross * 1.25 + secondBandHours * hourlyGross * 1.5;
  const overtimeRatio = rule.ratios?.overtimeNet ?? 0.905;

  return overtimeGross * overtimeRatio;
}

export function calculatePayroll(rule, state) {
  const zoneRate =
    state.zone === "paris"
      ? rule.mobility.parisDaily
      : rule.mobility.provinceDaily;
  const baseNetEstimate =
    rule.baseNetMonthly ?? rule.baseGrossMonthly * rule.netRatio;
  const nightBonus = state.nightShifts * rule.allowances.nightPerShiftNet;
  const weekendBonus = state.weekendShifts * rule.allowances.weekendPerShiftNet;
  const overtimeBonus = calculateOvertimeNet(rule, state);
  const grandDeplacementBonus = state.gdDays * zoneRate;
  const panierBonus = state.panierDays * rule.allowances.panierPerDayNet;
  const riskBonus = state.riskEnabled
    ? rule.allowances.environmentMonthlyNet
    : 0;
  const estimatedPayslipNet =
    baseNetEstimate + nightBonus + weekendBonus + overtimeBonus + riskBonus;
  const estimatedExpenseCoverage = grandDeplacementBonus + panierBonus;
  const estimatedCashAvailable =
    estimatedPayslipNet + estimatedExpenseCoverage;
  const pocketAfterLiving = Math.max(
    0,
    estimatedCashAvailable - state.livingCost,
  );

  return {
    baseNetEstimate: Math.round(baseNetEstimate),
    nightBonus: Math.round(nightBonus),
    weekendBonus: Math.round(weekendBonus),
    overtimeBonus: Math.round(overtimeBonus),
    grandDeplacementBonus: Math.round(grandDeplacementBonus),
    panierBonus: Math.round(panierBonus),
    riskBonus: Math.round(riskBonus),
    taxableVariableNet: Math.round(
      nightBonus + weekendBonus + overtimeBonus + riskBonus,
    ),
    estimatedPayslipNet: Math.round(estimatedPayslipNet),
    estimatedExpenseCoverage: Math.round(estimatedExpenseCoverage),
    estimatedCashAvailable: Math.round(estimatedCashAvailable),
    totalEstimatedNet: Math.round(estimatedPayslipNet),
    totalEstimatedCash: Math.round(estimatedCashAvailable),
    pocketAfterLiving: Math.round(pocketAfterLiving),
    livingCost: Math.round(state.livingCost),
  };
}
