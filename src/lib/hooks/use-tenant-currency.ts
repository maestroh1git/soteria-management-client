'use client';

import { useMyTenant } from './use-tenant';
import { useHydrated } from './use-hydrated';
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
  // The tenant is loaded by the layout and can be cached before a page
  // hydrates; the server rendered the default, so the first render must too.
  const hydrated = useHydrated();
  const { data } = useMyTenant();
  const tenant = hydrated ? data : undefined;
  const code = tenant?.settings?.currencyCode;
  return typeof code === 'string' && code ? code : DEFAULT_CURRENCY;
}
