-- 0012_repair_auth_user_token_columns
--
-- Every demo login failed with "Database error querying schema". The GoTrue auth
-- logs showed:
--
--   Scan error on column index 3, name "confirmation_token":
--   converting NULL to string is unsupported
--
-- GoTrue scans these columns into Go `string` values, which cannot hold NULL.
-- Users inserted directly into auth.users (as the demo seed did) leave them NULL
-- rather than at their intended empty-string default, which breaks sign-in for
-- *every* account once GoTrue reads the row.
--
-- This repair is idempotent: coalescing an already-empty string is a no-op, so
-- it is safe to re-run after any future direct insert or restore.

update auth.users
   set confirmation_token       = coalesce(confirmation_token, ''),
       recovery_token           = coalesce(recovery_token, ''),
       email_change             = coalesce(email_change, ''),
       email_change_token_new   = coalesce(email_change_token_new, ''),
       email_change_token_current = coalesce(email_change_token_current, ''),
       phone_change             = coalesce(phone_change, ''),
       phone_change_token       = coalesce(phone_change_token, ''),
       reauthentication_token   = coalesce(reauthentication_token, '')
 where confirmation_token is null
    or recovery_token is null
    or email_change is null
    or email_change_token_new is null
    or email_change_token_current is null
    or phone_change is null
    or phone_change_token is null
    or reauthentication_token is null;
