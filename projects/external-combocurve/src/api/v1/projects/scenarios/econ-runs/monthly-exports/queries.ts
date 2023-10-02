import { sql } from '@src/helpers/sql';

export const JOINED_TABLE_NAME = 'joined_monthly_table';

// put the filter in the select query after join query to ensure it only join on one run_id
export const JOIN_MONTHLY_TABLE_QUERY = sql`
WITH ${'joinedTableName'} AS
  (
    SELECT
      *
    FROM ${'monthlyTable'}
    LEFT JOIN ${'wellHeaderTable'}
    USING (run_id, well_id, run_date)
    LEFT JOIN ${'metadataTable'}
    USING (run_id, run_date)
  )
`;

export const SELECT_QUERY = sql`
SELECT
  ${'selection'}
FROM
  ${'table'}
WHERE 
  ${'where'}
`;

export const COUNT_QUERY = sql`
SELECT
  COUNT(*) AS count
FROM
  ${'table'}
WHERE 
  ${'where'}
`;
