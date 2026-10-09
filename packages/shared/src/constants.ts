import { DriveCategory } from './phase2-enums';

/**
 * Mandatory disclaimer displayed on every student-facing historical placement intelligence view.
 * Required by CampusEdge product policy: historical trends do not guarantee future hiring.
 */
export const HISTORICAL_INTELLIGENCE_DISCLAIMER =
  'Historical hiring patterns, test rounds, and package data reflect past recruitment seasons and do not guarantee future hiring criteria, interview formats, or offers from recruiting partners.';

/**
 * A company is designated as a recurring recruiter if it conducted campus drives
 * in >= 2 distinct seasons within the last 3 completed/active seasons.
 */
export const RECURRING_RECRUITER_MIN_SEASONS = 2;
export const RECURRING_RECRUITER_LOOKBACK_SEASONS = 3;

/**
 * Minimum student cohort size required to disclose aggregated compensation statistics
 * (average CTC, highest CTC) and conversion rates to student peers.
 */
export const MIN_COHORT_FOR_STATS = 3;

/**
 * Category hierarchy ranking for the institutional one-offer policy.
 * Students already SELECTED in a drive of rank R may only apply to drives of rank > R.
 */
export const DRIVE_CATEGORY_RANK: Record<DriveCategory, number> = {
  [DriveCategory.MASS_RECRUITER]: 1,
  [DriveCategory.REGULAR]: 2,
  [DriveCategory.DREAM]: 3,
  [DriveCategory.SUPER_DREAM]: 4,
};
