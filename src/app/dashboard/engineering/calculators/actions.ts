"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveAuthoritativeCalculatorRevision } from "@/lib/neon/calculators";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optionalNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key.replaceAll("_", " ")} must be a valid number.`);
  return value;
}

function fail(intakeId: string, message: string): never {
  redirect(`/dashboard/engineering/calculators/${intakeId}?error=${encodeURIComponent(message)}`);
}

export async function saveCalculatorRevision(fd: FormData) {
  const intakeId = text(fd, "engineering_intake_id");
  if (!intakeId) fail("missing", "Engineering intake identifier is missing.");

  try {
    const revision = await saveAuthoritativeCalculatorRevision(intakeId, {
      targetSolarContributionPct: optionalNumber(fd, "target_solar_contribution_pct"),
      specificYieldKwhPerKwpYear: optionalNumber(fd, "specific_yield_kwh_per_kwp_year"),
      targetDcAcRatio: optionalNumber(fd, "target_dc_ac_ratio"),
      peakSunHoursPerDay: optionalNumber(fd, "peak_sun_hours_per_day"),
      systemEfficiencyPct: optionalNumber(fd, "system_efficiency_pct"),
      autonomyHours: optionalNumber(fd, "autonomy_hours"),
      backupHours: optionalNumber(fd, "backup_hours"),
      backupLoadKw: optionalNumber(fd, "backup_load_kw"),
      batteryDodPct: optionalNumber(fd, "battery_dod_pct"),
      inverterHeadroomPct: optionalNumber(fd, "inverter_headroom_pct"),
    });

    revalidatePath("/dashboard/engineering");
    revalidatePath(`/dashboard/engineering/calculators/${intakeId}`);
    redirect(`/dashboard/engineering/calculators/${intakeId}?saved=${revision.revision}&authority=${encodeURIComponent(revision.engineVersion)}`);
  } catch (error) {
    fail(intakeId, error instanceof Error ? error.message : "Calculator revision could not be saved.");
  }
}
