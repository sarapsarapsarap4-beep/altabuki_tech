'use strict';

const ZERO_COMMISSION = Object.freeze({
  success: true,
  commissionRate: 0,
  commissionType: 'percentage',
  fixedAmount: 0,
  configType: 'platform_policy'
});

function applicableCommission() {
  return { ...ZERO_COMMISSION };
}

function setCommission(_scopeId, rate = 0, scope = 'global') {
  if (Number(rate) !== 0) {
    return { success: false, error: 'Platform commission is fixed at 0% and cannot be changed.' };
  }
  return {
    success: true,
    config: {
      config_type: scope,
      commission_rate: 0,
      commission_type: 'percentage',
      fixed_amount: 0,
      is_active: true
    }
  };
}

module.exports = { applicableCommission, setCommission };
