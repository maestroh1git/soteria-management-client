'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/common/data-table';
import { tenantColumns, tenantHref } from '@/features/admin/tenant-columns';
import { useTenants } from '@/lib/hooks/use-admin-tenants';
import { statusOptions } from '@/lib/status/registry';

export default function AdminTenantsPage() {
  const { data: tenants = [], isLoading, isError } = useTenants();
  const [status, setStatus] = useState<string>();
  const [kyb, setKyb] = useState<string>();

  const shown = tenants.filter(
    (t) =>
      (!status || (status === 'ACTIVE') === t.isActive) &&
      (!kyb || t.kybStatus === kyb),
  );
  const filtered = !!(status || kyb);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" description="Every organisation on the platform." />

      <DataTable
        columns={tenantColumns({ withType: true })}
        data={shown}
        loading={isLoading}
        isError={isError}
        errorSubject="the tenants"
        rowHref={tenantHref}
        searchText={(t) => `${t.name} ${t.slug}`}
        searchPlaceholder="Search by name or slug…"
        filters={[
          { id: 'status', label: 'statuses', value: status, options: statusOptions('tenant') },
          { id: 'kyb', label: 'KYB', value: kyb, options: statusOptions('kyb') },
        ]}
        onFilterChange={(id, value) => (id === 'status' ? setStatus(value) : setKyb(value))}
        emptyTitle={filtered ? 'No tenants match' : 'No tenants yet'}
        emptyDescription={filtered ? 'Try another status.' : undefined}
      />
    </div>
  );
}
