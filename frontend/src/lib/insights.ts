import { apiFetch, requireOk } from "./api";

type InsightRequest = {
  page: string;
  subject: string;
  data: unknown;
  context?: string;
};

type InsightResponse = {
  insight: string;
};

export async function generateInsight(request: InsightRequest) {
  const response = await apiFetch("/api/insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  await requireOk(response, "Failed to generate insight.");

  const data = (await response.json()) as InsightResponse;
  return data.insight;
}
