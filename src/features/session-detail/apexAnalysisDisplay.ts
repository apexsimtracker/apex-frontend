/** Matches GET /api/sessions/:id `apexAnalysis` after subscription gating. */
export type ApexAnalysisPayload =
  | string[]
  | { locked: true; message: string }
  | { locked: false; insights: string[] };

export type ApexAnalysisDisplay = {
  locked: boolean;
  message?: string;
  insights: string[];
};

export function parseApexAnalysisDisplay(
  payload: ApexAnalysisPayload | undefined | null
): ApexAnalysisDisplay {
  if (payload == null) {
    return { locked: false, insights: [] };
  }
  if (Array.isArray(payload)) {
    return { locked: false, insights: payload };
  }
  if (payload.locked === true) {
    return { locked: true, message: payload.message, insights: [] };
  }
  return { locked: false, insights: payload.insights ?? [] };
}
