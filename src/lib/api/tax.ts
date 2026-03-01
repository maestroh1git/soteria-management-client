import api from './client';
import type { TaxRule } from '@/lib/types/api';

export interface CreateTaxBracketDto {
  minAmount: number;
  maxAmount?: number;
  rate: number;
  fixedAmount?: number;
}

export interface CreateTaxRuleDto {
  name: string;
  type: string;
  value?: number;
  minSalary?: number;
  maxSalary?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isDefault?: boolean;
  brackets?: CreateTaxBracketDto[];
}

export type UpdateTaxRuleDto = Partial<CreateTaxRuleDto>;

export async function getTaxRules(): Promise<TaxRule[]> {
  return await api.get('/tax/rules') as unknown as TaxRule[];
}

export async function getTaxRule(id: string): Promise<TaxRule> {
  return await api.get(`/tax/rules/${id}`) as unknown as TaxRule;
}

export async function createTaxRule(dto: CreateTaxRuleDto): Promise<TaxRule> {
  return await api.post('/tax/rules', dto) as unknown as TaxRule;
}

export async function updateTaxRule(id: string, dto: UpdateTaxRuleDto): Promise<TaxRule> {
  return await api.patch(`/tax/rules/${id}`, dto) as unknown as TaxRule;
}

export async function deleteTaxRule(id: string): Promise<void> {
  await api.delete(`/tax/rules/${id}`);
}
