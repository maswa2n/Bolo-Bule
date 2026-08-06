type RegressionMetrics = {
  objective_detection_accuracy?: number;
  scoring_consistency?: number;
  false_completion_rate?: number;
  unnecessary_turn_rate?: number;
  bilingual_accuracy?: number;
  difficulty_matching?: number;
};

export type QualityGateResult = {
  pass: boolean;
  checks: Array<{ name: string; pass: boolean; value: number; target: string }>;
};

export function evaluateQualityGates(metrics: RegressionMetrics): QualityGateResult {
  const checks = [
    {
      name: "objective_detection_accuracy",
      value: metrics.objective_detection_accuracy ?? 0,
      pass: (metrics.objective_detection_accuracy ?? 0) >= 0.8,
      target: ">= 0.80",
    },
    {
      name: "scoring_consistency",
      value: metrics.scoring_consistency ?? 0,
      pass: (metrics.scoring_consistency ?? 0) >= 0.75,
      target: ">= 0.75",
    },
    {
      name: "false_completion_rate",
      value: metrics.false_completion_rate ?? 1,
      pass: (metrics.false_completion_rate ?? 1) <= 0.12,
      target: "<= 0.12",
    },
    {
      name: "bilingual_accuracy",
      value: metrics.bilingual_accuracy ?? 0,
      pass: (metrics.bilingual_accuracy ?? 0) >= 0.8,
      target: ">= 0.80",
    },
  ];

  return {
    pass: checks.every((item) => item.pass),
    checks,
  };
}
