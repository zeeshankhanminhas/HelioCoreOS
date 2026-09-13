import type { CalculatorInputs, CalculatorResult } from "./calculator";

export type HelioCalcPreliminaryResponse = {
  engineVersion: string;
  result: CalculatorResult;
};

export async function runPreliminarySizing(inputs: CalculatorInputs): Promise<HelioCalcPreliminaryResponse> {
  const baseUrl = process.env.HELIOCALC_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("HelioCalc is not configured. Set HELIOCALC_URL before saving engineering calculations.");

  const response = await fetch(`${baseUrl}/v1/calculator/preliminary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.HELIOCALC_SERVICE_TOKEN ? { "X-HelioCalc-Token": process.env.HELIOCALC_SERVICE_TOKEN } : {}),
    },
    body: JSON.stringify(inputs),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(payload?.detail || `HelioCalc returned HTTP ${response.status}.`);
  }
  return response.json() as Promise<HelioCalcPreliminaryResponse>;
}
