CREATE OR REPLACE FUNCTION public.ri_admin_daily_stats()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  definition text;
  candidates oid[];
  event_table regclass;
  time_column text;
  time_type oid;
  time_expression text;
  today date := (now() AT TIME ZONE 'Europe/Bratislava')::date;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(
    (public.ri_premium_access()::jsonb->>'is_admin')::boolean,false
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501';
  END IF;

  SELECT string_agg(lower(replace(pg_catalog.pg_get_functiondef(p.oid),'"','')),' ')
  INTO definition FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='bagvyr_record_event';

  SELECT array_agg(DISTINCT c.oid) INTO candidates
  FROM regexp_matches(definition,
    '\minsert\s+into\s+(?:public\.)?([a-z_][a-z_0-9]*)','g') AS m
  JOIN pg_catalog.pg_class c ON c.relname=m[1] AND c.relkind IN ('r','p')
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
  WHERE EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attname='visitor_id' AND NOT a.attisdropped)
  AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attname='event_type' AND NOT a.attisdropped)
  AND EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid=c.oid AND a.attname IN
      ('occurred_at','created_at','recorded_at','event_time','timestamp')
    AND a.atttypid IN ('timestamptz'::regtype,'timestamp'::regtype)
    AND NOT a.attisdropped);

  IF coalesce(cardinality(candidates),0) <> 1 THEN
    RAISE EXCEPTION 'Cannot identify the existing analytics event table. Existing data was not changed.';
  END IF;
  event_table := candidates[1]::regclass;
  SELECT a.attname,a.atttypid INTO time_column,time_type
  FROM pg_catalog.pg_attribute a WHERE a.attrelid=event_table
    AND a.attname IN ('occurred_at','created_at','recorded_at','event_time','timestamp')
    AND a.atttypid IN ('timestamptz'::regtype,'timestamp'::regtype)
    AND NOT a.attisdropped
  ORDER BY array_position(ARRAY['occurred_at','created_at','recorded_at','event_time','timestamp'],a.attname::text)
  LIMIT 1;
  time_expression := CASE WHEN time_type='timestamp'::regtype
    THEN format('e.%I AT TIME ZONE ''UTC''',time_column)
    ELSE format('e.%I',time_column) END;

  EXECUTE format($query$
    WITH first_record AS (
      SELECT min((%1$s AT TIME ZONE 'Europe/Bratislava')::date) AS first_day
      FROM %2$s e WHERE e.event_type IN ('page_view','token_search')
    ), counts AS (
      SELECT (%1$s AT TIME ZONE 'Europe/Bratislava')::date AS day,
        count(DISTINCT e.visitor_id) AS visitors,
        count(DISTINCT e.visitor_id) FILTER (WHERE e.event_type='token_search') AS searchers,
        count(*) FILTER (WHERE e.event_type='token_search') AS searches
      FROM %2$s e
      WHERE e.event_type IN ('page_view','token_search')
        AND (%1$s) >= (($1-13)::timestamp AT TIME ZONE 'Europe/Bratislava')
        AND (%1$s) < (($1+1)::timestamp AT TIME ZONE 'Europe/Bratislava')
      GROUP BY 1
    ), days AS (
      SELECT $1-i AS day FROM generate_series(0,13) i
    )
    SELECT jsonb_build_object(
      'timezone','Europe/Bratislava',
      'updated_at',now(),
      'days',jsonb_agg(jsonb_build_object(
        'day',d.day,
        'visitors',CASE WHEN f.first_day IS NULL OR d.day<f.first_day THEN NULL ELSE coalesce(c.visitors,0) END,
        'searchers',CASE WHEN f.first_day IS NULL OR d.day<f.first_day THEN NULL ELSE coalesce(c.searchers,0) END,
        'searches',CASE WHEN f.first_day IS NULL OR d.day<f.first_day THEN NULL ELSE coalesce(c.searches,0) END
      ) ORDER BY d.day DESC)
    )
    FROM days d CROSS JOIN first_record f LEFT JOIN counts c USING(day)
  $query$,time_expression,event_table) INTO result USING today;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.ri_admin_daily_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ri_admin_daily_stats() TO authenticated;
