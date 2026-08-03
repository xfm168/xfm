export interface PerfReportItem { label: string; iterations: number; totalMs: number; avgMs: number; p50Ms: number; p95Ms: number; p99Ms: number; maxMs: number; withinBudget5ms: boolean; }
export interface PerfReport { items: PerfReportItem[]; generatedAt: string; overallVerdict: 'PASS' | 'WARN' | 'FAIL'; }
export interface StressReport {
  iterations: number; totalMs: number; avgMs: number;
  memStartMB: number; memMidMB: number; memEndMB: number; memGrowthMB: number; memLeakDetected: boolean;
  objectCountStart: number; objectCountEnd: number; objectGrowth: number; objectLeak: boolean;
  pluginStateConsistent: boolean;
  errorCount: number;
  verdict: 'PASS' | 'WARN' | 'FAIL';
}
export interface RegressionExtReport {
  total: number; passed: number; failed: number; accuracy: number;
  conflictRate: number;
  misjudgeRate: number;
  explainAvgScore: number;
  evidenceCompleteRate: number;
  perTag: Record<string, {total:number;passed:number;acc:number;explainAvg:number}>;
  perCombination: Record<string, {total:number;passed:number;acc:number}>;
  failures: Array<{caseId:string;caseName:string;reason:string}>;
}
export interface FinalAcceptanceReport {
  generatedAt: string;
  buildNumber: string;
  tests: { total: number; passed: number; failed: number; passRate: number; };
  failures: Array<{section: string; detail: string}>;
  performance: { avgMs: number; p95Ms: number; p99Ms: number; maxMs: number; batch10kAvgMs: number; };
  evidenceCoveragePct: number;
  explainCoveragePct: number;
  classicsCoveragePct: number;
  regressionAccuracyPct: number;
  knownRisks: string[];
  releaseDecision: 'PASS' | 'FAIL' | 'CONDITIONAL_PASS';
  releaseRecommendations: string[];
  summary: string;
}
