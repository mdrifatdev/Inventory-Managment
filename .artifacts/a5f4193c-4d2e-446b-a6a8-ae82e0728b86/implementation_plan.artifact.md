# Implementation Plan - Fix Supabase Common Issues & Cleanup

The goal is to fix common Supabase integration issues (specifically for Capacitor/Mobile environments) and perform requested cleanup.

## Proposed Changes

### [Cleanup]

#### [DELETE] [README.md](file:///H:/inventory/Inventory-Managment/README.md)
- Successfully removed as requested.

### [Supabase Integration]

#### [MODIFY] [src/lib/supabaseClient.ts](file:///H:/inventory/Inventory-Managment/src/lib/supabaseClient.ts)
- **Robust Client Initialization**:
  - Add URL cleaning (trimming whitespace and removing trailing slashes).
  - Explicitly configure Auth to persist sessions and auto-refresh tokens, which is critical for Capacitor apps.
  - Add checks to prevent creating a client with placeholder values (like "YOUR_URL").
- **Error Handling**: Improve console logging to be more descriptive of the failure reason.

#### [NEW] [supabase_setup.sql](file:///H:/inventory/Inventory-Managment/supabase_setup.sql)
- Provide a ready-to-run SQL script for the Supabase SQL Editor.
- This resolves the most common "issue" where tables or RLS policies are missing.
- Includes tables for `products` and `inventory_logs` with correct types and basic RLS.

## Verification Plan

### Automated Verification
- Verify that the app still compiles using `npm run lint`.
- Verify that `README.md` is gone.

### Manual Verification
- Check the console logs in the browser to ensure no "invalid URL" errors are thrown during initialization.
- Verify that the app still falls back to LocalStorage when Supabase is not configured.
