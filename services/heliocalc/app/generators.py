from __future__ import annotations

from html import escape

from .models import BomItem, ElectricalDesignModel


def generate_bom(model: ElectricalDesignModel) -> list[BomItem]:
    items = [
        BomItem(category="PV", description="PV module", manufacturer=model.pv.module.manufacturer, model=model.pv.module.model, quantity=model.pv.module_quantity, unit="ea", equipment_id=model.pv.module.equipment_id),
        BomItem(category="Power conversion", description="Inverter / PCS", manufacturer=model.pv.inverter.manufacturer, model=model.pv.inverter.model, quantity=model.pv.inverter_quantity, unit="ea", equipment_id=model.pv.inverter.equipment_id),
    ]
    if model.battery:
        items.append(BomItem(category="BESS", description="Battery unit", manufacturer=model.battery.battery.manufacturer, model=model.battery.battery.model, quantity=model.battery.quantity, unit="ea", equipment_id=model.battery.battery.equipment_id))
    for run in model.cables:
        items.append(BomItem(category="Cable", description=run.input.name, manufacturer=run.input.cable.manufacturer, model=run.input.cable.model, quantity=run.input.length_m, unit="m", equipment_id=run.input.cable.equipment_id))
    for protection in model.protection:
        device = protection.selection.device
        items.append(BomItem(category="Protection", description=f"{device.device_type} · {protection.selection.location}", manufacturer=device.manufacturer, model=device.model, quantity=1, unit="ea", equipment_id=device.equipment_id))
    if not model.protection:
        items.extend([
            BomItem(category="Protection", description="DC isolation / protection package", quantity=1, unit="lot", status="engineering_review"),
            BomItem(category="Protection", description="AC isolation / protection package", quantity=1, unit="lot", status="engineering_review"),
        ])
    return items


def _box(x: int, y: int, w: int, h: int, title: str, lines: list[str]) -> str:
    text = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="white" stroke="#171717"/>', f'<text x="{x + 12}" y="{y + 22}" font-size="13" font-weight="600">{escape(title)}</text>']
    for index, line in enumerate(lines):
        text.append(f'<text x="{x + 12}" y="{y + 42 + index * 16}" font-size="11" fill="#555">{escape(line)}</text>')
    return "".join(text)


def generate_sld_svg(model: ElectricalDesignModel) -> str:
    width, height = 1120, 430
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="HelioCoreOS single line diagram">', '<style>text{font-family:Arial,Helvetica,sans-serif}.wire{stroke:#171717;stroke-width:2;fill:none}.review{stroke-dasharray:6 4}</style>', '<rect width="1120" height="430" fill="#f7f6f2"/>']
    parts.append('<text x="40" y="36" font-size="18" font-weight="700">HelioCoreOS · Generated SLD</text>')
    parts.append(f'<text x="40" y="57" font-size="11" fill="#666">{escape(model.system_type.value.replace("_", " ").title())} · {escape(model.engine_version)}</text>')

    parts.append(_box(40, 105, 200, 115, "PV ARRAY", [f'{model.pv.module_quantity} × {model.pv.module.model}', f'{model.pv.total_strings} strings × {model.pv.modules_per_string}', f'{model.pv.array_capacity_kwp:.2f} kWp']))
    parts.append('<path class="wire" d="M240 162 H310"/>')
    parts.append(_box(310, 115, 150, 95, "DC PROTECTION", ["Isolator / SPD / fuses", "Engineering review"] if not model.protection else ["Selected devices", "See BOM"] ))
    parts.append('<path class="wire" d="M460 162 H530"/>')
    parts.append(_box(530, 105, 200, 115, "INVERTER / PCS", [f'{model.pv.inverter_quantity} × {model.pv.inverter.model}', f'{model.pv.inverter_ac_capacity_kw:.1f} kW AC', f'DC/AC {model.pv.dc_ac_ratio:.2f}']))
    parts.append('<path class="wire" d="M730 162 H800"/>')
    parts.append(_box(800, 115, 150, 95, "AC PROTECTION", ["Isolation / breaker / SPD", "Engineering review"] if not model.protection else ["Selected devices", "See BOM"] ))
    parts.append('<path class="wire" d="M950 162 H1030"/>')
    endpoint = "GRID / MDB" if model.system_type.value == "on_grid" else "LOAD / MDB"
    parts.append(_box(1030, 125, 70, 75, endpoint, []))

    if model.battery:
        parts.append(_box(530, 285, 200, 90, "BESS", [f'{model.battery.quantity} × {model.battery.battery.model}', f'{model.battery.installed_usable_kwh:.1f} kWh usable', f'{model.battery.installed_discharge_power_kw:.1f} kW']))
        parts.append('<path class="wire" d="M630 285 V220"/>')
    if model.system_type.value == "hybrid":
        parts.append('<text x="808" y="244" font-size="11" fill="#666">Grid + backup/load topology</text>')
    if model.system_type.value == "off_grid":
        parts.append('<text x="808" y="244" font-size="11" fill="#666">Independent supply topology</text>')

    parts.append('<text x="40" y="410" font-size="10" fill="#777">Generated from the same ElectricalDesignModel used for calculations and BOM. Protection coordination and jurisdiction-specific approval remain engineering gates.</text>')
    parts.append('</svg>')
    return "".join(parts)
