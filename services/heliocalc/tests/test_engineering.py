import unittest

from app.calculations import compile_design, preliminary_sizing
from app.generators import generate_bom, generate_sld_svg
from app.models import BatteryDatasheet, DetailedDesignRequest, InverterDatasheet, LoadBasis, PreliminarySizingRequest, PvModuleDatasheet, SystemType


class HelioCalcTests(unittest.TestCase):
    def setUp(self):
        self.module = PvModuleDatasheet(manufacturer="Example PV", model="M-580", pmaxW=580, vocV=51.2, vmpV=43.1, iscA=14.3, impA=13.46, tempCoeffVocPctC=-0.25, tempCoeffVmpPctC=-0.29, maxSystemVoltageV=1500)
        self.inverter = InverterDatasheet(manufacturer="Example Power", model="INV-100", inverterType="hybrid", ratedAcPowerKw=100, maxPvInputPowerKw=150, maxDcVoltageV=1100, mpptMinV=180, mpptMaxV=1000, mpptCount=10, maxInputCurrentPerMpptA=30, maxShortCircuitCurrentPerMpptA=40, maxStringsPerMppt=2, maxEfficiencyPct=98.5, batteryVoltageMinV=500, batteryVoltageMaxV=900)
        self.battery = BatteryDatasheet(manufacturer="Example Storage", model="B-100", nominalCapacityKwh=100, usableCapacityKwh=90, nominalVoltageV=768, operatingVoltageMinV=600, operatingVoltageMaxV=850, maxChargePowerKw=50, maxDischargePowerKw=50, maxDodPct=90, roundTripEfficiencyPct=95)

    def test_preliminary_off_grid(self):
        result = preliminary_sizing(PreliminarySizingRequest(systemType="off_grid", annualEnergyKwh=36500, averageDailyEnergyKwh=100, peakDemandKw=30, essentialPeakDemandKw=20, peakSunHoursPerDay=5, systemEfficiencyPct=80, autonomyHours=24, batteryDodPct=90, inverterHeadroomPct=20))
        self.assertAlmostEqual(result.recommended_pv_kwp, 25.0)
        self.assertGreater(result.battery_nominal_kwh or 0, 100)
        self.assertFalse(any(v.severity == "error" for v in result.validations))

    def test_datasheet_design_drives_sld_and_bom(self):
        req = DetailedDesignRequest(systemType=SystemType.HYBRID, targetPvKwp=220, minimumCellTempC=0, maximumCellTempC=70, load=LoadBasis(annualEnergyKwh=300000, averageDailyEnergyKwh=822, peakDemandKw=160, essentialPeakDemandKw=60), pvModule=self.module, inverter=self.inverter, battery=self.battery, backupHours=4, backupLoadKw=60)
        model, validations = compile_design(req)
        self.assertGreater(model.pv.module_quantity, 0)
        self.assertGreater(model.pv.total_strings, 0)
        self.assertIsNotNone(model.battery)
        self.assertFalse(any(v.severity == "error" for v in validations))
        bom = generate_bom(model)
        self.assertEqual(bom[0].quantity, model.pv.module_quantity)
        svg = generate_sld_svg(model)
        self.assertIn("Generated SLD", svg)
        self.assertIn(self.module.model, svg)
        self.assertIn(self.battery.model, svg)


if __name__ == "__main__":
    unittest.main()
