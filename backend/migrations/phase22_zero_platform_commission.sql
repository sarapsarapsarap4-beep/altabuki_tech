-- Phase 22: platform commission is permanently fixed at 0%.
-- Safe to re-run. Historical settled transactions are intentionally preserved.
DO $$ BEGIN
  IF to_regclass('public.commission_config') IS NOT NULL THEN
    UPDATE commission_config SET commission_rate=0, commission_type='percentage', fixed_amount=0
    WHERE commission_rate <> 0 OR commission_type <> 'percentage' OR COALESCE(fixed_amount,0) <> 0;
  END IF;
  IF to_regclass('public.platform_settings') IS NOT NULL THEN
    INSERT INTO platform_settings (setting_key, setting_value, setting_type, description, is_public)
    VALUES ('default_commission_rate','0','number','Platform commission is permanently fixed at 0%',false)
    ON CONFLICT (setting_key) DO UPDATE SET setting_value='0',setting_type='number',description='Platform commission is permanently fixed at 0%',updated_at=CURRENT_TIMESTAMP;
  END IF;
  IF to_regclass('public.commission_transactions') IS NOT NULL THEN
    UPDATE commission_transactions SET commission_rate=0,commission_amount=0,net_amount=gross_amount,commission_type='percentage',config_type='platform_policy'
    WHERE status='pending' AND (commission_amount <> 0 OR commission_rate <> 0 OR net_amount <> gross_amount);
  END IF;
END $$;
