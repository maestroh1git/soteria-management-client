import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from '@/lib/api/countries';
import type { CreateCountryDto, UpdateCountryDto } from '@/lib/api/countries';
import {
  getSettings,
  upsertSetting,
  deleteSetting,
} from '@/lib/api/settings';
import type { UpsertSettingDto } from '@/lib/api/settings';

// ── Country hooks ───────────────────────────────────────────

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
  });
}

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCountryDto) => createCountry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country created');
    },
    onError: () => toast.error('Failed to create country'),
  });
}

export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCountryDto }) =>
      updateCountry(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country updated');
    },
    onError: () => toast.error('Failed to update country'),
  });
}

export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCountry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['countries'] });
      toast.success('Country deleted');
    },
    onError: () => toast.error('Failed to delete country'),
  });
}

// ── Settings hooks ──────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertSettingDto) => upsertSetting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Setting saved');
    },
    onError: () => toast.error('Failed to save setting'),
  });
}

export function useDeleteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSetting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Setting deleted');
    },
    onError: () => toast.error('Failed to delete setting'),
  });
}
