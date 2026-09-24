'use client';

import { useMyTenant } from './use-tenant';
import { DEFAULT_CURRENCY } from '@/lib/utils/money';

/**
 * The currency this organisation keeps its books in.
 *
 * Read from the tenant's settings (`settings.currencyCode`), else naira — every
 * tenant today is Nigerian, and the API has no per-tenant currency column yet.
 * This is the one place that answer lives, so when tenants carry a country the
 * change is here and nowhere else.
 */
export function useTenantCurrency(): string {
  const { data: tenant } = useMyTenant();
  const code = tenant?.settings?.currencyCode;
  return typeof code === 'string' && code ? code : DEFAULT_CURRENCY;
}
