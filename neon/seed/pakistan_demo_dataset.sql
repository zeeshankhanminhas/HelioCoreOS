-- HelioCoreOS Pakistan demonstration dataset
-- Fictional data only. All email domains use .example.
-- Legacy columns ending in _gbp contain PKR values for this Pakistan profile.

do $seed$
declare
  v_org uuid;
  v_actor uuid;
  v_org_count integer;
  i integer;
  j integer;
  v_customer uuid;
  v_site uuid;
  v_opp uuid;
  v_survey uuid;
  v_project uuid;
  v_stage text;
  v_prop_status text;
  v_survey_status text;
  v_design_status text;
  v_project_status text;
  v_risk text;
  v_capacity numeric;
  v_battery numeric;
  v_value numeric;
  v_city text;
  v_province text;
  v_disco text;
  v_industry text;
  customer_names text[] := array[
    'Al-Noor Textile Industries (Pvt.) Ltd.',
    'PakFresh Cold Chain Solutions (Pvt.) Ltd.',
    'Crescent Polymer Packaging (Pvt.) Ltd.',
    'Indus Dairy Processing Company (Pvt.) Ltd.',
    'Mehran Ceramic Works (Pvt.) Ltd.',
    'Frontier Engineering Systems (Pvt.) Ltd.',
    'Sundar Food Products (Pvt.) Ltd.',
    'Ravi Auto Components (Pvt.) Ltd.',
    'Capital Medical Complex (Pvt.) Ltd.',
    'Chenab Rice Processing Mills (Pvt.) Ltd.',
    'Sapphire Surgical Supplies (Pvt.) Ltd.',
    'Kohat Cement Products (Pvt.) Ltd.',
    'Margalla Education Services (Pvt.) Ltd.',
    'Sialkot Sports Manufacturing (Pvt.) Ltd.',
    'Balochistan Cold Logistics (Pvt.) Ltd.',
    'Hyderabad Flour Mills (Pvt.) Ltd.',
    'Gujranwala Fan Works (Pvt.) Ltd.',
    'Multan Agro Processing (Pvt.) Ltd.',
    'Karachi Marine Foods (Pvt.) Ltd.',
    'Islamabad Data Services (Pvt.) Ltd.',
    'Peshawar Steel Fabrication (Pvt.) Ltd.',
    'Kasur Leather Processing (Pvt.) Ltd.',
    'Rahim Yar Khan Sugar Products (Pvt.) Ltd.',
    'Faisalabad Knitwear (Pvt.) Ltd.',
    'Lahore Pharma Laboratories (Pvt.) Ltd.'
  ];
  industries text[] := array[
    'Textiles','Cold storage','Packaging','Dairy processing','Ceramics',
    'Engineering','Food processing','Automotive components','Healthcare','Rice processing',
    'Medical supplies','Cement products','Education','Sports goods','Cold-chain logistics',
    'Flour milling','Electrical appliances','Agro processing','Seafood processing','Data services',
    'Steel fabrication','Leather processing','Sugar processing','Knitwear','Pharmaceuticals'
  ];
  cities text[] := array[
    'Faisalabad','Lahore','Karachi','Multan','Gujranwala',
    'Peshawar','Lahore','Lahore','Islamabad','Gujranwala',
    'Sialkot','Kohat','Islamabad','Sialkot','Quetta',
    'Hyderabad','Gujranwala','Multan','Karachi','Islamabad',
    'Peshawar','Kasur','Rahim Yar Khan','Faisalabad','Lahore'
  ];
  provinces text[] := array[
    'Punjab','Punjab','Sindh','Punjab','Punjab',
    'Khyber Pakhtunkhwa','Punjab','Punjab','Islamabad Capital Territory','Punjab',
    'Punjab','Khyber Pakhtunkhwa','Islamabad Capital Territory','Punjab','Balochistan',
    'Sindh','Punjab','Punjab','Sindh','Islamabad Capital Territory',
    'Khyber Pakhtunkhwa','Punjab','Punjab','Punjab','Punjab'
  ];
  discos text[] := array[
    'FESCO','LESCO','K-Electric','MEPCO','GEPCO',
    'PESCO','LESCO','LESCO','IESCO','GEPCO',
    'GEPCO','PESCO','IESCO','GEPCO','QESCO',
    'HESCO','GEPCO','MEPCO','K-Electric','IESCO',
    'PESCO','LESCO','MEPCO','FESCO','LESCO'
  ];
begin
  -- Optional overrides, set in the same SQL session:
  -- select set_config('heliocore.demo_organisation_id','<organisation-uuid>',false);
  -- select set_config('heliocore.demo_actor_id','<profile-uuid>',false);
  v_org := nullif(current_setting('heliocore.demo_organisation_id', true), '')::uuid;
  if v_org is null then
    select count(*) into v_org_count from public.organisations;
    if v_org_count <> 1 then
      raise exception 'Multiple organisations found. Set heliocore.demo_organisation_id before running this seed.';
    end if;
    select id into v_org from public.organisations limit 1;
  end if;

  v_actor := nullif(current_setting('heliocore.demo_actor_id', true), '')::uuid;
  if v_actor is null then
    select id into v_actor from public.profiles
    where organisation_id = v_org and status = 'active'
    order by created_at limit 1;
  end if;

  create or replace function pg_temp.demo_uuid(p_key text)
  returns uuid language sql immutable as $$
    select (substr(md5(p_key),1,8)||'-'||substr(md5(p_key),9,4)||'-'||substr(md5(p_key),13,4)||'-'||substr(md5(p_key),17,4)||'-'||substr(md5(p_key),21,12))::uuid
  $$;

  delete from public.activity_logs where organisation_id = v_org and (event_type like 'demo.%' or description like '%PK-DEMO-%');
  delete from public.system_designs where organisation_id = v_org and design_reference like 'PK-DEMO-%';
  delete from public.site_surveys where organisation_id = v_org and survey_reference like 'PK-DEMO-%';
  delete from public.indicative_proposals where organisation_id = v_org and proposal_number like 'PK-DEMO-%';
  delete from public.opportunity_readiness_items where organisation_id = v_org and opportunity_id in (select id from public.opportunities where organisation_id = v_org and reference like 'PK-DEMO-%');
  update public.opportunities set project_id = null where organisation_id = v_org and reference like 'PK-DEMO-%';
  delete from public.projects where organisation_id = v_org and reference like 'PK-DEMO-%';
  delete from public.opportunities where organisation_id = v_org and reference like 'PK-DEMO-%';
  delete from public.sites where organisation_id = v_org and customer_id in (select id from public.customers where organisation_id = v_org and notes like '%[PK-DEMO]%');
  delete from public.customers where organisation_id = v_org and notes like '%[PK-DEMO]%';

  for i in 1..25 loop
    v_customer := pg_temp.demo_uuid('pk-demo-customer-' || i);
    insert into public.customers (
      id, organisation_id, name, display_name, customer_category, country_code,
      contact_name, contact_email, phone, registration_identifier, tax_identifier,
      currency_code, payment_terms_days, status, notes, created_at, updated_at
    ) values (
      v_customer, v_org, customer_names[i], customer_names[i], industries[i], 'PK',
      'Demo Energy Manager ' || lpad(i::text,2,'0'),
      'energy' || lpad(i::text,2,'0') || '@pk-demo.example',
      '+92-300-555-' || lpad(i::text,4,'0'),
      'SECP-DEMO-' || lpad(i::text,4,'0'), 'NTN-DEMO-' || lpad((7000000+i)::text,7,'0'),
      'PKR', case when i % 4 = 0 then 45 else 30 end,
      case when i <= 20 then 'active' else 'prospect' end,
      '[PK-DEMO] Fictional ' || industries[i] || ' customer for HelioCoreOS workflow testing. City: ' || cities[i] || ', Province: ' || provinces[i] || '. Utility: ' || discos[i] || '.',
      now() - make_interval(days => 180 - i * 3), now() - make_interval(days => 5 + i % 12)
    );
  end loop;

  for i in 1..35 loop
    j := case when i <= 25 then i else i - 25 end;
    v_customer := pg_temp.demo_uuid('pk-demo-customer-' || j);
    v_site := pg_temp.demo_uuid('pk-demo-site-' || i);
    v_city := cities[j]; v_province := provinces[j]; v_disco := discos[j];
    insert into public.sites (id, organisation_id, customer_id, name, address, postcode, created_at, updated_at)
    values (
      v_site, v_org, v_customer,
      '[PK-DEMO] ' || case when i <= 25 then 'Principal Facility' else 'Satellite Facility ' || (i-25) end || ' — ' || v_city,
      'Plot ' || (10 + i) || ', ' || case
        when v_city = 'Lahore' then 'Sundar Industrial Estate'
        when v_city = 'Faisalabad' then 'M-3 Industrial City'
        when v_city = 'Karachi' then 'Korangi Industrial Area'
        when v_city = 'Islamabad' then 'I-9 Industrial Area'
        when v_city = 'Gujranwala' then 'Small Industrial Estate'
        when v_city = 'Sialkot' then 'Sialkot Export Processing Zone'
        when v_city = 'Multan' then 'Multan Industrial Estate'
        when v_city = 'Peshawar' then 'Hayatabad Industrial Estate'
        when v_city = 'Hyderabad' then 'SITE Hyderabad'
        when v_city = 'Quetta' then 'Eastern Bypass Industrial Area'
        else v_city || ' Industrial Area' end || ', ' || v_city || ', ' || v_province || '. Utility: ' || v_disco || '.',
      'PK-' || upper(substr(v_city,1,3)) || '-' || lpad(i::text,3,'0'),
      now() - make_interval(days => 160 - i * 2), now() - make_interval(days => 4 + i % 10)
    );
  end loop;

  for i in 1..50 loop
    j := ((i - 1) % 25) + 1;
    v_customer := pg_temp.demo_uuid('pk-demo-customer-' || j);
    v_site := pg_temp.demo_uuid('pk-demo-site-' || case when i > 35 then j else ((i - 1) % 35) + 1 end);
    v_capacity := (120 + ((i * 73) % 1180))::numeric;
    v_battery := case when i % 4 = 0 then (250 + ((i * 90) % 1750))::numeric else 0 end;
    v_value := round(v_capacity * (118000 + (i % 7) * 5500) + v_battery * 58000, 0);
    v_stage := case when i <= 25 then 'won' when i <= 35 then 'proposal' when i <= 40 then 'readiness' when i <= 42 then 'qualified' when i <= 45 then 'lead' when i <= 48 then 'lost' else 'proposal' end;
    v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i);

    insert into public.opportunities (
      id, organisation_id, customer_id, site_id, owner_id, title, reference, stage,
      lead_source, estimated_pv_kwp, estimated_battery_kwh, estimated_value_gbp,
      notes, created_at, updated_at
    ) values (
      v_opp, v_org, v_customer, v_site, v_actor,
      customer_names[j] || ' — ' || v_capacity || ' kWp Solar' || case when v_battery > 0 then ' + ' || v_battery || ' kWh BESS' else '' end,
      'PK-DEMO-OPP-' || lpad(i::text,3,'0'), v_stage,
      (array['Website enquiry','Referral','Industry association','LinkedIn outreach','Existing customer expansion'])[1 + ((i-1) % 5)],
      v_capacity, nullif(v_battery,0), v_value,
      '[PK-DEMO] Pakistan commercial and industrial Solar EPC opportunity. Utility context: ' || discos[j] || '. Monetary figures stored in legacy *_gbp fields are PKR. Typical daytime demand ' || round(v_capacity * 1.35,0) || ' kW; transformer ' || (500 + ((i * 250) % 2500)) || ' kVA.',
      now() - make_interval(days => 150 - least(i,45) * 2), now() - make_interval(days => 1 + i % 18)
    );

    foreach v_industry in array array['electricity_bill','customer_id','proof_of_address','ownership_evidence','meter_photo','survey_authorisation'] loop
      insert into public.opportunity_readiness_items (
        id, organisation_id, opportunity_id, item_type, status, evidence_url,
        review_note, decision_note, is_required, reviewed_by, reviewed_at, updated_by, updated_at
      ) values (
        pg_temp.demo_uuid('pk-demo-ready-' || i || '-' || v_industry), v_org, v_opp, v_industry,
        case when i <= 35 then case when v_industry = 'proof_of_address' and i % 9 = 0 then 'waived' else 'accepted' end
             when i <= 40 then case when v_industry in ('electricity_bill','customer_id','meter_photo') then 'accepted' when v_industry = 'ownership_evidence' then 'under_review' else 'requested' end
             when i <= 42 then case when v_industry = 'electricity_bill' then 'uploaded' else 'requested' end
             when i <= 45 then 'requested'
             else case when v_industry = 'ownership_evidence' then 'rejected' else 'accepted' end end,
        case when i <= 42 and not (i <= 35 and v_industry = 'proof_of_address' and i % 9 = 0) then 'https://demo.heliocoreos.example/pk/readiness/' || lpad(i::text,3,'0') || '/' || v_industry else null end,
        case when i <= 35 then 'Evidence reviewed against the customer and site record.' when i <= 40 then 'Commercial team is completing the readiness pack.' when i >= 46 and v_industry = 'ownership_evidence' then 'Ownership evidence did not match the proposed installation boundary.' else null end,
        case when i <= 35 and v_industry = 'proof_of_address' and i % 9 = 0 then 'Waived because the registered lease and utility account provide equivalent evidence.' when i >= 46 and v_industry = 'ownership_evidence' then 'Rejected pending corrected property or lease documentation.' else null end,
        v_industry <> 'proof_of_address', case when i <= 40 or i >= 46 then v_actor else null end,
        case when i <= 40 or i >= 46 then now() - make_interval(days => 4 + i % 14) else null end,
        v_actor, now() - make_interval(days => 2 + i % 12)
      );
    end loop;
  end loop;

  for i in 1..40 loop
    if i <= 25 then v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i); v_prop_status := 'accepted';
    elsif i <= 35 then v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i); v_prop_status := case when i <= 30 then 'issued' else 'draft' end;
    else v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || (i + 10)); v_prop_status := case when i <= 38 then 'declined' else 'expired' end;
    end if;
    select estimated_pv_kwp, coalesce(estimated_battery_kwh,0), estimated_value_gbp into v_capacity, v_battery, v_value from public.opportunities where id = v_opp;
    insert into public.indicative_proposals (
      id, organisation_id, opportunity_id, proposal_number, status, pv_capacity_kwp,
      battery_capacity_kwh, estimated_generation_kwh, estimated_annual_saving_gbp,
      indicative_price_gbp, assumptions, exclusions, valid_until, issued_at, created_at, updated_at
    ) values (
      pg_temp.demo_uuid('pk-demo-proposal-' || i), v_org, v_opp, 'PK-DEMO-PROP-' || lpad(i::text,3,'0'), v_prop_status,
      v_capacity, nullif(v_battery,0), round(v_capacity * (1460 + (i % 5) * 25),0),
      round(v_capacity * (1460 + (i % 5) * 25) * (38 + i % 9),0), v_value,
      'PKR commercial basis. Self-consumption modelled from supplied bills and daytime operating profile. Final price remains subject to approved survey, structural verification, utility requirements and final BOM.',
      'Major roof strengthening, utility fees, taxes outside the stated basis, transformer replacement and customer-side shutdown losses are excluded unless expressly added.',
      current_date + case when v_prop_status = 'expired' then -15 else 30 + i end,
      case when v_prop_status = 'draft' then null else now() - make_interval(days => 22 + i % 18) end,
      now() - make_interval(days => 45 + i % 30), now() - make_interval(days => 3 + i % 16)
    );
  end loop;

  for i in 1..30 loop
    v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i);
    select site_id, estimated_pv_kwp, coalesce(estimated_battery_kwh,0) into v_site, v_capacity, v_battery from public.opportunities where id = v_opp;
    v_survey_status := case when i <= 25 then 'approved' when i <= 27 then 'under_review' when i <= 29 then 'in_progress' else 'rejected' end;
    v_survey := pg_temp.demo_uuid('pk-demo-survey-' || i);
    insert into public.site_surveys (
      id, organisation_id, opportunity_id, site_id, survey_reference, status, survey_date,
      surveyor_name, weather_conditions, access_notes, roof_type, roof_covering, roof_condition,
      roof_orientation_deg, roof_pitch_deg, usable_roof_area_m2, shading_summary, structural_observations,
      supply_phase, main_fuse_rating_a, meter_location, consumer_unit_location, earthing_arrangement,
      cable_route_notes, inverter_location, battery_location, fire_safety_notes, asbestos_risk,
      working_at_height_risk, planning_constraints, grid_constraints, other_constraints,
      recommended_pv_kwp, recommended_battery_kwh, photo_links, drawing_links, review_note,
      approved_by, approved_at, created_by, created_at, updated_at
    ) values (
      v_survey, v_org, v_opp, v_site, 'PK-DEMO-SUR-' || lpad(i::text,3,'0'), v_survey_status,
      current_date - (38 - i), 'Engr. Demo Surveyor ' || (1 + i % 4),
      case when i % 3 = 0 then 'Hazy, 34°C, light wind' else 'Clear, 31°C, dry conditions' end,
      'Access through maintenance stair and roof hatch. Mobile crane access available from the loading yard.',
      case when i % 5 = 0 then 'reinforced_concrete' else 'industrial_shed' end,
      case when i % 5 = 0 then 'concrete slab with waterproofing' else 'pre-painted galvanised steel sheet' end,
      case when i = 30 then 'poor' when i % 6 = 0 then 'fair' else 'good' end,
      180 + (i % 21), case when i % 5 = 0 then 2 else 6 end, round(v_capacity * 7.1,0),
      case when i % 7 = 0 then 'Moderate morning shading from water tanks and adjacent services.' else 'Minor local shading; no material annual-loss concern.' end,
      case when i = 30 then 'Corrosion and local purlin deformation require structural remediation before design.' else 'Primary members appear serviceable; final structural verification remains mandatory.' end,
      'three_phase', 800 + (i % 7) * 400, 'Main metering panel beside transformer yard', 'Main LT switchroom',
      'TN-S with site earth grid', 'DC route across roof cable trays; AC route to main LT panel.',
      'Ventilated ground-floor electrical room', case when v_battery > 0 then 'Dedicated fire-rated external BESS compound' else null end,
      'Maintain fire lanes, isolator access and emergency signage.', 'none_identified',
      'Temporary edge protection, lifeline and controlled access required.',
      'No material planning restriction identified for rooftop installation.',
      'Export and interconnection remain subject to the relevant DISCO approval and protection study.',
      case when i % 8 = 0 then 'Weekend shutdown required for final AC tie-in.' else 'Tie-in to be coordinated around production maintenance window.' end,
      v_capacity, nullif(v_battery,0),
      array['https://demo.heliocoreos.example/pk/surveys/' || lpad(i::text,3,'0') || '/roof-overview.jpg','https://demo.heliocoreos.example/pk/surveys/' || lpad(i::text,3,'0') || '/lt-panel.jpg'],
      array['https://demo.heliocoreos.example/pk/surveys/' || lpad(i::text,3,'0') || '/roof-markup.pdf'],
      case when v_survey_status = 'rejected' then 'Rejected: structural remediation evidence is required.' when v_survey_status = 'approved' then 'Approved for governed system design.' else 'Survey package progressing through engineering review.' end,
      case when v_survey_status = 'approved' then v_actor else null end,
      case when v_survey_status = 'approved' then now() - make_interval(days => 8 + i % 10) else null end,
      v_actor, now() - make_interval(days => 35 - i), now() - make_interval(days => 2 + i % 9)
    );
  end loop;

  for i in 1..25 loop
    v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i); v_survey := pg_temp.demo_uuid('pk-demo-survey-' || i);
    select site_id, estimated_pv_kwp, coalesce(estimated_battery_kwh,0) into v_site, v_capacity, v_battery from public.opportunities where id = v_opp;
    v_design_status := case when i <= 15 then 'approved' when i <= 20 then 'under_review' when i <= 23 then 'in_progress' when i = 24 then 'rejected' else 'draft' end;
    insert into public.system_designs (
      id, organisation_id, opportunity_id, site_id, survey_id, design_reference, revision, status,
      design_basis, module_manufacturer, module_model, module_rating_wp, module_quantity, array_capacity_kwp,
      inverter_manufacturer, inverter_model, inverter_quantity, inverter_capacity_kw, dc_ac_ratio,
      string_configuration, mounting_system, battery_manufacturer, battery_model, battery_quantity,
      battery_capacity_kwh, annual_generation_kwh, specific_yield_kwh_kwp, performance_ratio_pct,
      export_limit_kw, grid_application_required, grid_application_reference, single_line_diagram_url,
      layout_drawing_url, structural_calculation_url, generation_report_url, design_assumptions,
      design_constraints, review_note, approved_by, approved_at, created_by, created_at, updated_at
    ) values (
      pg_temp.demo_uuid('pk-demo-design-' || i), v_org, v_opp, v_site, v_survey,
      'PK-DEMO-DES-' || lpad(i::text,3,'0'), 1, v_design_status,
      'Approved site survey, twelve-month consumption history, daytime operating profile and DISCO interconnection basis.',
      case when i % 3 = 0 then 'JA Solar' when i % 3 = 1 then 'LONGi' else 'JinkoSolar' end,
      case when i % 3 = 0 then 'JAM72D42-630/LB' when i % 3 = 1 then 'Hi-MO 7 625W' else 'Tiger Neo 625W' end,
      case when i % 3 = 0 then 630 else 625 end,
      ceil(v_capacity * 1000 / case when i % 3 = 0 then 630 else 625 end)::integer,
      round((ceil(v_capacity * 1000 / case when i % 3 = 0 then 630 else 625 end) * case when i % 3 = 0 then 630 else 625 end) / 1000.0,3),
      case when i % 2 = 0 then 'Huawei' else 'Sungrow' end,
      case when i % 2 = 0 then 'SUN2000-100KTL-M2' else 'SG110CX' end,
      greatest(1, ceil(v_capacity / 115.0)::integer), case when i % 2 = 0 then 100 else 110 end,
      round(v_capacity / (greatest(1,ceil(v_capacity / 115.0)) * case when i % 2 = 0 then 100 else 110 end),3),
      '28 modules per string with MPPT allocation balanced by roof zone; final string schedule controlled in SLD.',
      case when i % 5 = 0 then 'Ballasted aluminium mounting on concrete roof' else 'Rail-based aluminium mounting fixed to verified purlins' end,
      case when v_battery > 0 then 'Sungrow' else null end, case when v_battery > 0 then 'PowerTitan 2.0' else null end,
      case when v_battery > 0 then greatest(1,ceil(v_battery / 500.0)::integer) else 0 end, nullif(v_battery,0),
      round(v_capacity * (1470 + (i % 6) * 22),0), 1470 + (i % 6) * 22, 79.5 + (i % 6) * 0.6,
      case when i % 4 = 0 then round(v_capacity * 0.65,0) else 0 end, true,
      'DISCO-PK-DEMO-' || lpad(i::text,4,'0'),
      'https://demo.heliocoreos.example/pk/designs/' || lpad(i::text,3,'0') || '/sld.pdf',
      'https://demo.heliocoreos.example/pk/designs/' || lpad(i::text,3,'0') || '/layout.pdf',
      'https://demo.heliocoreos.example/pk/designs/' || lpad(i::text,3,'0') || '/structure.pdf',
      'https://demo.heliocoreos.example/pk/designs/' || lpad(i::text,3,'0') || '/yield.pdf',
      'Module availability remains subject to approved-equivalent substitution. Yield assumes standard soiling and agreed cleaning frequency.',
      'Export limit, roof loading, shutdown window and transformer protection settings remain controlled project constraints.',
      case when v_design_status = 'rejected' then 'Rejected for string-layout revision around the fire-access corridor.' when v_design_status = 'approved' then 'Approved revision locked for project handover.' else 'Engineering package remains in the stated governed workflow position.' end,
      case when v_design_status = 'approved' then v_actor else null end,
      case when v_design_status = 'approved' then now() - make_interval(days => 4 + i % 8) else null end,
      v_actor, now() - make_interval(days => 24 - i / 2), now() - make_interval(days => 1 + i % 7)
    );
  end loop;

  for i in 1..25 loop
    v_opp := pg_temp.demo_uuid('pk-demo-opportunity-' || i);
    select customer_id, site_id, estimated_pv_kwp, coalesce(estimated_battery_kwh,0), estimated_value_gbp into v_customer, v_site, v_capacity, v_battery, v_value from public.opportunities where id = v_opp;
    v_project := pg_temp.demo_uuid('pk-demo-project-' || i);
    v_project_status := (array['qualification','survey','design','commercial','procurement','installation','commissioning','handover','complete','on_hold'])[1 + ((i-1) % 10)];
    v_risk := case when i % 9 = 0 then 'red' when i % 4 = 0 then 'amber' else 'green' end;
    insert into public.projects (
      id, organisation_id, customer_id, site_id, name, reference, status, risk_status,
      project_type, pv_capacity_kwp, battery_capacity_kwh, contract_value_gbp,
      target_completion_date, project_owner_id, notes, created_at, updated_at
    ) values (
      v_project, v_org, v_customer, v_site,
      'PK Demo EPC Project ' || lpad(i::text,3,'0') || ' — ' || v_capacity || ' kWp',
      'PK-DEMO-PRJ-' || lpad(i::text,3,'0'), v_project_status, v_risk,
      case when v_battery > 0 then 'Commercial rooftop PV + BESS' else 'Commercial rooftop PV' end,
      v_capacity, nullif(v_battery,0), v_value, current_date + 45 + i * 5, v_actor,
      '[PK-DEMO] Converted from PK-DEMO-OPP-' || lpad(i::text,3,'0') || '. Contract value is PKR despite the legacy contract_value_gbp column name. ' || case when v_risk = 'red' then 'Critical dependency: customer shutdown and utility protection approval.' when v_risk = 'amber' then 'Watch item: imported equipment lead time and structural sign-off.' else 'No material exception beyond normal EPC controls.' end,
      now() - make_interval(days => 20 - least(i,18)), now() - make_interval(days => i % 8)
    );
    update public.opportunities set project_id = v_project, updated_at = now() - make_interval(days => i % 8) where id = v_opp and organisation_id = v_org;
  end loop;

  for i in 1..50 loop
    insert into public.activity_logs (organisation_id, actor_id, event_type, description, created_at) values
      (v_org, v_actor, 'demo.opportunity_created', 'PK-DEMO-OPP-' || lpad(i::text,3,'0') || ' created from Pakistan commercial intake.', now() - make_interval(days => 150 - least(i,45) * 2)),
      (v_org, v_actor, 'demo.relationships_assigned', 'Customer and Site assigned to PK-DEMO-OPP-' || lpad(i::text,3,'0') || '.', now() - make_interval(days => 142 - least(i,45) * 2)),
      (v_org, v_actor, 'demo.readiness_progressed', 'Readiness evidence progressed for PK-DEMO-OPP-' || lpad(i::text,3,'0') || '.', now() - make_interval(days => 132 - least(i,45) * 2));
  end loop;
  for i in 1..40 loop
    insert into public.activity_logs (organisation_id, actor_id, event_type, description, created_at)
    values (v_org, v_actor, 'demo.proposal_progressed', 'PK-DEMO-PROP-' || lpad(i::text,3,'0') || ' progressed through governed commercial workflow.', now() - make_interval(days => 38 + i % 20));
  end loop;
  for i in 1..30 loop
    insert into public.activity_logs (organisation_id, actor_id, event_type, description, created_at)
    values (v_org, v_actor, 'demo.site_survey_progressed', 'PK-DEMO-SUR-' || lpad(i::text,3,'0') || ' progressed through field-survey governance.', now() - make_interval(days => 26 + i % 12));
  end loop;
  for i in 1..25 loop
    insert into public.activity_logs (organisation_id, actor_id, event_type, description, created_at) values
      (v_org, v_actor, 'demo.system_design_progressed', 'PK-DEMO-DES-' || lpad(i::text,3,'0') || ' progressed through engineering governance.', now() - make_interval(days => 18 + i % 10)),
      (v_org, v_actor, 'demo.project_created', 'PK-DEMO-PRJ-' || lpad(i::text,3,'0') || ' created from the accepted commercial opportunity.', now() - make_interval(days => 12 + i % 8));
  end loop;

  raise notice 'Pakistan demo dataset seeded for organisation %: 25 customers, 35 sites, 50 opportunities and 25 projects.', v_org;
end
$seed$;
