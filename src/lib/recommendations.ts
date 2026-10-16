import { prisma } from "@/lib/prisma";
import { estimateExceptionCost } from "@/lib/rules/cost";
import type { ExceptionType, SlaStatus } from "@/lib/rules/sla";
import { recommendAction } from "@/lib/ai/recommend";
import { justifyRecommendation } from "@/lib/ai/provider";

interface GenerateRecommendationInput {
  exceptionId: string;
  type: ExceptionType;
  severity: string | null;
  slaStatus: SlaStatus;
  scheduledEta: Date;
  reportedAt: Date;
  originWarehouseId: string;
  destWarehouseId: string;
  hasDriver: boolean;
}

/** Orchestrates the deterministic recommendation engine + AI justification + storage. */
export async function generateRecommendation(input: GenerateRecommendationInput) {
  const suggestedCompensation = estimateExceptionCost({
    type: input.type,
    severity: input.severity,
    slaStatus: input.slaStatus,
    scheduledEta: input.scheduledEta,
    reportedAt: input.reportedAt,
  });

  const { type: recommendationType, details } = recommendAction({
    type: input.type,
    severity: input.severity,
    slaStatus: input.slaStatus,
    originWarehouseId: input.originWarehouseId,
    destWarehouseId: input.destWarehouseId,
    hasDriver: input.hasDriver,
    suggestedCompensation,
  });

  const justification = await justifyRecommendation({
    recommendationType,
    details,
    exceptionType: input.type,
    severity: input.severity,
    slaStatus: input.slaStatus,
  });

  return prisma.aIRecommendation.create({
    data: {
      exceptionId: input.exceptionId,
      type: recommendationType,
      details,
      justification,
    },
  });
}
