-- Optional one-off: align stored ISO currency columns with company default (e.g. EUR).
-- Review before running in production. Replace @cid with your companies.id.

-- SET @cid = 1;
-- UPDATE companies SET currency = 'EUR' WHERE id = @cid;
-- UPDATE system_settings SET setting_value = 'EUR' WHERE company_id = @cid AND setting_key = 'default_currency';

-- Uncomment blocks as needed for your schema (only tables that exist in your DB):

-- UPDATE deals SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE invoices SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE estimates SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE proposals SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE offers SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE orders SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE contracts SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE project_payments SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
-- UPDATE project_expenses SET currency = 'EUR' WHERE company_id = @cid AND (currency IS NULL OR currency = 'USD');
