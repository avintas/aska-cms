/**
 * TypeScript Types for Tango CMS Public Wisdom API
 *
 * Copy this file into your OnlyHockey project for type safety
 */

// Wisdom entry from the API
export interface WisdomEntry {
  id: number;
  title: string;
  musing: string;
  from_the_box: string;
  theme: string | null;
  category: string | null;
  attribution: string | null;
}

// API Response for single wisdom (random endpoint)
export interface WisdomSingleResponse {
  success: boolean;
  data: WisdomEntry;
  error?: string;
}

// API Response for multiple wisdom (latest/list endpoints)
export interface WisdomListResponse {
  success: boolean;
  data: WisdomEntry[];
  count: number;
  error?: string;
}

// API Error Response
export interface ApiErrorResponse {
  success: false;
  error: string;
}

// Query parameters for wisdom endpoints
export interface WisdomQueryParams {
  theme?: string;
  category?: string;
  limit?: number;
  offset?: number;
}
