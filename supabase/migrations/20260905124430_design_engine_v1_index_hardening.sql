create index if not exists system_designs_load_profile_org_idx on public.system_designs(load_profile_id, organisation_id);
create index if not exists system_designs_pv_module_org_idx on public.system_designs(pv_module_id, organisation_id);
create index if not exists system_designs_inverter_org_idx on public.system_designs(inverter_id, organisation_id);
create index if not exists system_designs_battery_org_idx on public.system_designs(battery_id, organisation_id);
create index if not exists system_design_string_groups_org_idx on public.system_design_string_groups(organisation_id);
create index if not exists system_design_checks_org_idx on public.system_design_checks(organisation_id);
