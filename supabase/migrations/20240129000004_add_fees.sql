-- Add interest_rate and service_fee to loans table
-- interest_rate: The percentage interest (e.g., 5.0 for 5%)
-- service_fee: The actual amount deducted as fee (e.g., 2.50)
alter table loans 
  add column interest_rate decimal default 0.0,
  add column service_fee decimal default 0.0;

-- Optional: Create a system wallet profile to collect fees
-- For now, fees just disappear from circulation (deflationary) or we can track them.
-- Let's stick to tracking in the 'loans' table for simplicity.
