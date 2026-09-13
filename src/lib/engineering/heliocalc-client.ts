import type { CalculatorInputs, CalculatorResult } from "./calculator";

export type HelioCalcPreliminaryResponse = {
  engineVersion: string;
  result: CalculatorResult;
};

const DEFAULT_TIMEOUT_MS = 15000;

export async function runPreliminarySizing(inputs: CalculatorInputs): Promise<HelioCalcPreliminaryResponse> {
  const baseUrl = process.env.HELIOCALC_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("HelioCalc is not configured. Set HELIOCALC_URL before saving engineering calculations.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/v1/calculator/preliminary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HELIOCALC_SERVICE_TOKEN ? { "X-HelioCalc-Token": process.env.HELIOCALC_SERVICE_TOKEN } : {}),
      },
      body: JSON.stringify(inputs),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { detail?: string } | null;
      throw new Error(payload?.detail || `HelioCalc returned HTTP ${response.status}.`);
    }

    const payload = await response.json() as Partial<HelioCalcPreliminaryResponse>;
    if (!payload.engineVersion || !payload.result || !Array.isArray(payload.result.validations)) {
      throw new Error("HelioCalc returned an invalid authoritative response contract.");
    }

    return payload as HelioCalcPreliminaryResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("HelioCalc did not respond within 15 seconds. No engineering revision was saved.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
