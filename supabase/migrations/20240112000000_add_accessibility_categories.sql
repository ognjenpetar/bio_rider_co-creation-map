-- Add accessibility-related location categories
-- (wheelchair access, blind/visually-impaired access, places needing accessibility improvements)

ALTER TABLE locations DROP CONSTRAINT locations_category_check;
ALTER TABLE locations ADD CONSTRAINT locations_category_check
  CHECK (category = ANY (ARRAY[
    'fountain','spring','wc','rest_area','shade','shelter','picnic',
    'bike_repair','parking','bus_stop','camping','fast_food','sports_field',
    'phone_charger','wifi','wheelchair_access','blind_access','needs_accessibility',
    'green_area','biotop_significant','fishing',
    'wildlife','water_quality','viewpoint','excursion','tourist','cultural',
    'church','playground','cafe','shop','cleaning_action','illegal_dump',
    'recycling','info_board','danger','intersection','other'
  ]::text[]));
