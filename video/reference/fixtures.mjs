/*
 * A fake API for the real client: the Greenfield College story, answering
 * exactly the endpoints the film's screens call. Shapes follow src/lib/api.
 * Later routes override earlier ones.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ACTIONS = Object.keys(JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../src/lib/auth/actions.generated.json', import.meta.url)), 'utf8')));

const tenant = { id: 't1', name: 'Greenfield College', slug: 'greenfield', schemaName: 'tenant_greenfield', organizationType: 'SCHOOL', industry: 'Education', isActive: true };

const people = {
  tenant_owner: { id: 'u1', email: 'proprietor@greenfield.edu.ng', firstName: 'Adebayo', lastName: 'Bello', employeeId: null },
  educator: { id: 'u2', email: 'amaka.eze@greenfield.edu.ng', firstName: 'Amaka', lastName: 'Eze', employeeId: 'e1' },
};

const routes = [];
const on = (method, re, fn) => routes.push([method, re, fn]);

export default {
  user(role) {
    const p = people[role] || people.tenant_owner;
    return { ...p, mustChangePassword: false, systemRoles: [role === 'educator' ? 'EMPLOYEE' : role], tenantId: 't1', tenant };
  },
  handle(method, path, q, role, body) {
    for (const [m, re, fn] of [...routes].reverse()) { // later routes override earlier ones
      const hit = m === method && path.match(re);
      if (hit) return fn({ q, role, hit, body: body ? JSON.parse(body) : null });
    }
    return undefined;
  },
  on,
};

on('GET', /^\/auth\/session$/, ({ role }) => {
  const p = people[role] || people.tenant_owner;
  return {
    user: { ...p, mustChangePassword: false, systemRoles: [role === 'educator' ? 'EMPLOYEE' : role], tenantId: 't1' },
    tenant: { id: 't1', name: tenant.name, slug: tenant.slug, organizationType: 'SCHOOL' },
    capabilities: role === 'educator' ? ACTIONS.filter((a) => /^(self|attendance\.take|attendance\.read)/.test(a)) : ACTIONS,
    identity: { principalType: 'EMPLOYEE', employeeId: p.employeeId, guardianId: null, formTeacherOf: role === 'educator' ? ['arm-jss2-gold'] : [] },
  };
});
on('GET', /^\/branding$/, () => ({ logoUrl: null, faviconUrl: null, primaryColor: null, accentColor: null }));

// ── Dashboard ─────────────────────────────────────────────────────
const page = (items) => ({ items, total: items.length, page: 1, limit: 50, totalPages: 1 });
const monthSummary = (month, gross, net, n = 64) => ({
  period: { month, year: 2026 },
  summary: { totalEmployees: n, totalGrossSalary: String(gross), totalNetSalary: String(net), totalTax: String(Math.round(gross * 0.09)), totalDeductions: String(gross - net) },
  employeeBreakdown: [],
});
const MONTHS = [[4, 16980000, 14420000], [5, 17050000, 14480000], [6, 17120000, 14530000], [7, 17310000, 14660000], [8, 17380000, 14700000], [9, 17460000, 14820000]];
const loans = { totalActiveLoans: 11, totalOutstandingBalance: 3840000, totalDisbursed: 6200000, loansByType: [], loansByStatus: [] };
on('GET', /^\/tenants\/me$/, () => ({ ...tenant, onboardingDismissed: true }));
on('GET', /^\/branding\/me$/, () => ({ primaryColor: null, accentColor: null, hasLogo: false, hasFavicon: false, logoUrl: null, faviconUrl: null }));
on('GET', /^\/reports\/year-end$/, () => ({ year: 2026, monthlySummaries: MONTHS.map(([m, g, n]) => monthSummary(m, g, n)), taxSummary: {}, loanPortfolio: loans, totals: { totalGrossSalary: '0', totalNetSalary: '0', totalTax: '0', totalDeductions: '0' } }));
on('GET', /^\/reports\/monthly-summary$/, () => monthSummary(9, 17460000, 14820000));
on('GET', /^\/reports\/loan-portfolio$/, () => loans);
on('GET', /^\/reports\/department-cost$/, () => ({ month: 9, year: 2026, departments: [['Teaching', 41, 11820000], ['Administration', 9, 2410000], ['Bursary', 4, 1160000], ['Facilities', 10, 2070000]].map(([d, c, g]) => ({ department: d, employeeCount: c, totalGross: String(g), totalNet: String(Math.round(g * 0.85)), avgSalary: String(Math.round(g / c)) })) }));
on('GET', /^\/payroll\/salaries$/, () => page([]));
on('GET', /^\/approvals$/, () => ({ total: 2, counts: { payroll: 1, expense: 1 }, items: [] }));
on('GET', /^\/home$/, () => ({ items: [
  { key: 'approvals', count: 2, href: '/approvals' },
  { key: 'registers', count: 3, href: '/attendance' },
  { key: 'overdueInvoices', count: 14, amount: '1240000', href: '/fees' },
] }));
on('GET', /^\/fees\/summary$/, () => ({ term: { id: 'term1', name: 'First Term 2026/27' }, billed: '55400000', collected: '48200000', outstanding: '7200000', collectionRate: 87, studentsOwing: 142, unallocatedCredit: '0' }));
on('GET', /^\/budgets\/variance$/, () => []);
on('GET', /^\/events\/upcoming/, () => []);
on('GET', /^\/employees\/completeness\/summary$/, () => ({ employees: 64, complete: 64, readyToPay: 64, counts: { CRITICAL: 0, IMPORTANT: 0, OPTIONAL: 0 }, gaps: [], incomplete: [] }));
on('GET', /^\/attendance\/summary\/day$/, () => ({ date: '2026-09-24', dayType: null, isTeachingDay: true, enrolled: 612, inSchool: 575, rate: 94, armsTotal: 24, armsNotTaken: [], arms: [] }));
on('GET', /^\/academics\/sessions$/, () => [{ id: 's1', name: '2026/2027', startDate: '2026-09-07', endDate: '2027-07-23', isCurrent: true }]);
on('GET', /^\/departments$/, () => [{ id: 'd1', name: 'Teaching' }, { id: 'd2', name: 'Administration' }]);
on('GET', /^\/roles$/, () => [{ id: 'r1', name: 'Educator', departmentId: 'd1' }]);
on('GET', /^\/salary-components$/, () => [{ id: 'sc1', name: 'Basic salary', type: 'EARNING' }]);
on('GET', /^\/tax\/rules$/, () => [{ id: 'tx1', name: 'PAYE 2026', isDefault: true, isActive: true }]);
on('GET', /^\/employees$/, () => [{ id: 'e1', firstName: 'Amaka', lastName: 'Eze', employeeNumber: 'GFC-E-014', status: 'ACTIVE' }]);
on('GET', /^\/pay-periods$/, () => [{ id: 'pp9', name: 'September 2026', month: 9, year: 2026, startDate: '2026-09-01', endDate: '2026-09-30', paymentDate: '2026-09-25', status: 'APPROVED' }]);
on('GET', /^\/fees\/items$/, () => [{ id: 'fi1', name: 'Tuition' }]);
on('GET', /^\/ledger\/income-statement$/, () => ({ income: [], expenses: [], totalIncome: '48200000', totalExpenses: '31400000', net: '16800000' }));
// Plain array, not paginated.
on('GET', /^\/admissions\/applications$/, () => []);
const ARMS = [['arm-jss1-blue', 'Blue', 'JSS1'], ['arm-jss2-gold', 'Gold', 'JSS2'], ['arm-jss3-gold', 'Gold', 'JSS3'], ['arm-ss1-green', 'Green', 'SS1']]
  .map(([id, name, lvl], i) => ({ id, name, capacity: 32, levelId: 'lvl-' + lvl, formTeacherId: i === 1 ? 'e1' : null, formTeacherName: i === 1 ? 'Amaka Eze' : null, enrolled: 30, level: { id: 'lvl-' + lvl, name: lvl, sortOrder: i } }));
on('GET', /^\/academics\/arms$/, () => ARMS);
on('GET', /^\/students$/, () => ({ items: [], total: 612, page: 1, limit: 1, totalPages: 612 }));

// ── Follow up (at risk) ───────────────────────────────────────────
on('GET', /^\/academics\/terms$/, () => [{ id: 'term1', name: 'First Term', sessionId: 's1', startDate: '2026-09-07', endDate: '2026-12-11', isCurrent: true, sortOrder: 1 }]);
const risk = (id, f, l, adm, cls, inS, days, g, ph, contact) => ({ studentId: id, firstName: f, lastName: l, admissionNumber: adm, className: cls, inSchool: inS, absent: days - inS, teachingDays: days, attendanceRate: Math.round((inS / days) * 1000) / 10, guardianName: g, guardianPhone: ph, lastContact: contact });
export const AT_RISK = [
  risk('st-tobi', 'Tobi', 'Adeyemi', 'GFC/2025/0339', 'JSS2 Gold', 10, 14, 'Mrs Funke Adeyemi', '0803 412 7781', null),
  risk('st-daniel', 'Daniel', 'Okoro', 'GFC/2023/0102', 'SS1 Green', 11, 14, 'Mr Samuel Okoro', '0812 553 0194', { at: '2026-09-18T10:12:00Z', reached: true, by: 'Grace Ade' }),
  risk('st-ifeoma', 'Ifeoma', 'Nwosu', 'GFC/2026/0041', 'JSS1 Blue', 11, 14, 'Mr Chinedu Nwosu', '0806 771 2230', null),
  risk('st-zainab', 'Zainab', 'Musa', 'GFC/2024/0210', 'JSS3 Gold', 12, 14, 'Mrs Hauwa Musa', '0703 118 4462', null),
];
on('GET', /^\/attendance\/at-risk$/, () => ({ items: AT_RISK, total: AT_RISK.length, page: 1, limit: 20, totalPages: 1, teachingDays: 14 }));
on('GET', /^\/academics\/sessions\/current$/, () => ({ id: 's1', name: '2026/2027', startDate: '2026-09-07', endDate: '2027-07-23', isCurrent: true }));

// ── The gate ──────────────────────────────────────────────────────
const stu = (id, f, l, adm, arm) => ({ id, admissionNumber: adm, firstName: f, middleName: null, lastName: l, dateOfBirth: '2013-03-02', gender: 'FEMALE', admissionDate: '2024-09-09', status: 'ACTIVE', address: null, currentClassArmId: arm });
const STUDENTS = [stu('st-chiamaka', 'Chiamaka', 'Obi', 'GFC/2024/0117', 'arm-jss1-blue'), stu('st-chidi', 'Chidinma', 'Obi', 'GFC/2022/0088', 'arm-jss3-gold')];
on('GET', /^\/students$/, ({ q }) => {
  const s = (q.get('search') || '').toLowerCase();
  const items = s ? STUDENTS.filter((x) => (x.firstName + ' ' + x.lastName).toLowerCase().includes(s)) : [];
  return { items, total: s ? items.length : 612, page: 1, limit: 10, totalPages: 1 };
});
on('GET', /^\/attendance\/departures\/collectors\/.+$/, () => [
  { guardianId: 'g1', name: 'Mrs Ngozi Obi', relationship: 'Mother', phone: '0802 330 1188', isPrimary: true, canCollect: true, blockedReason: null },
  { guardianId: 'g2', name: 'Mr Emeka Obi', relationship: 'Father', phone: '0805 912 4471', isPrimary: false, canCollect: true, blockedReason: null },
  { guardianId: 'g3', name: 'Mr Chidi Okafor', relationship: 'Uncle', phone: '0701 555 2093', isPrimary: false, canCollect: false, blockedReason: 'Not permitted to collect. On file since 12 Jan 2026.' },
]);
on('GET', /^\/attendance\/departures$/, () => [
  { id: 'dp1', studentId: 'st-x', pupilName: 'Bello, Amina', admissionNumber: 'GFC/2026/0012', className: 'JSS1 Blue', departedAt: '2026-09-24T09:40:00Z', returnedAt: '2026-09-24T11:05:00Z', reasonCode: 'APPOINTMENT', reasonNote: null, collectedBy: 'Mr Yusuf Bello', collectedByRelationship: 'Father', wasOverride: false, overrideReason: null },
]);

// ── Register (educator) ───────────────────────────────────────────
const JSS2 = ['Amina Bello', 'David Okafor', 'Esther Johnson', 'Ibrahim Sani', 'Tobi Adeyemi', 'Grace Obi', 'Chidera Nnamdi', 'Oluwaseun Ade', 'Fatima Yusuf', 'Kemi Balogun', 'Michael Etim', 'Blessing Uche', 'Samuel Ojo', 'Halima Garba']
  .map((n, i) => { const [f, l] = n.split(' '); return { studentId: 'p' + i, admissionNumber: `GFC/2025/${String(311 + i * 7).padStart(4, '0')}`, firstName: f, lastName: l, status: null, reasonCode: null, reasonNote: null, minutesLate: null, markId: null, recordedAt: null, recordedByName: null }; });
on('GET', /^\/attendance\/register$/, ({ q }) => ({ classArmId: 'arm-jss2-gold', className: 'JSS2 Gold', date: q.get('date'), dayType: 'TEACHING', termId: 'term1', termName: 'First Term', markable: true, blockedReason: null, alreadyMarked: false, canAmend: true, pupils: JSS2 }));
on('GET', /^\/attendance\/my-classes\/[^/]+$/, () => ({ classArmId: 'arm-jss2-gold', className: 'JSS2 Gold', pupils: [], medicalAlerts: [], signedOutToday: [] }));

// ── Fees: invoices, the invoice, and the parent's public bill ─────
on('GET', /^\/academics\/levels$/, () => ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2'].map((n, i) => ({ id: 'lvl-' + n, name: n, code: n, sortOrder: i, active: true })));
const inv = (n, id, adm, name, lvl, tot, paid) => ({ id, invoiceNumber: `INV-2026-${n}`, status: 'ISSUED', origin: 'STRUCTURE', issueDate: '2026-09-07', dueDate: '2026-09-30', admissionNumber: adm, studentId: 'st-' + id, studentName: name, classLevel: lvl, termName: 'First Term', charges: String(tot), discounts: '0', total: String(tot), paid: String(paid), outstanding: String(tot - paid) });
const INVOICES = [
  inv('0412', 'amina', 'GFC/2026/0012', 'Bello, Amina', 'JSS1', 185000, 185000),
  inv('0413', 'tobi', 'GFC/2025/0339', 'Adeyemi, Tobi', 'JSS2', 185000, 100000),
  inv('0414', 'chuka', 'GFC/2022/0077', 'Eze, Chuka', 'SS2', 210000, 150000),
  inv('0415', 'folake', 'GFC/2024/0150', 'Adewale, Folake', 'JSS3', 185000, 185000),
  inv('0416', 'musa', 'GFC/2023/0098', 'Abdullahi, Musa', 'SS1', 210000, 0),
];
INVOICES.forEach((x) => (x.id = 'inv-' + x.studentId.slice(3)));
on('GET', /^\/fees\/invoices$/, ({ q }) => (q.get('status') === 'DRAFT' ? page([]) : page(INVOICES)));
const TOBI_LINES = [['Tuition', 150000], ['Development levy', 15000], ['Books and materials', 12000], ['Sports and clubs', 8000]].map(([d, a], i) => ({ id: 'l' + i, kind: 'CHARGE', description: d, amount: String(a), feeItemId: null, concessionId: null, sortOrder: i }));
on('GET', /^\/fees\/invoices\/[^/]+$/, () => ({ id: 'inv-tobi', invoiceNumber: 'INV-2026-0413', status: 'ISSUED', issueDate: '2026-09-07', dueDate: '2026-09-30', notes: null, cancellationReason: null, lines: TOBI_LINES, charges: '185000', discounts: '0', total: '185000', paid: '100000', outstanding: '85000', allowedTransitions: ['CANCELLED'], student: { id: 'st-tobi', firstName: 'Tobi', lastName: 'Adeyemi', admissionNumber: 'GFC/2025/0339' }, term: { id: 'term1', name: 'First Term' }, classLevel: { id: 'lvl-JSS2', name: 'JSS2' } }));
on('GET', /^\/invoice\/[^/]+$/, () => ({ organisationName: 'Greenfield College', invoiceNumber: 'INV-2026-0413', status: 'ISSUED', issueDate: '2026-09-07', dueDate: '2026-09-30', studentName: 'Tobi Adeyemi', admissionNumber: 'GFC/2025/0339', className: 'JSS2 Gold', termName: 'First Term 2026/27', lines: TOBI_LINES.map(({ description, kind, amount }) => ({ description, kind, amount })), charges: '185000', discounts: '0', total: '185000',
  paid: process.env.PAID ? '185000' : '100000', outstanding: process.env.PAID ? '0' : '85000',
  payments: [{ receiptNumber: 'RCT-2026-0288', paidOn: '2026-09-12', amount: '100000' }, ...(process.env.PAID ? [{ receiptNumber: 'RCT-2026-0391', paidOn: '2026-09-24', amount: '85000' }] : [])] }));

// ── Receipts, record a payment, ledger ────────────────────────────
const ACCOUNTS = [
  ['a-bank', 'BANK', 'GTBank — operating', 'ASSET', 48200000], ['a-cash', 'CASH', 'Cash at the bursary', 'ASSET', 312000],
  ['a-ar', 'FEES_RECEIVABLE', 'Fees receivable', 'ASSET', 7200000], ['a-fee', 'FEE_INCOME', 'Fee income', 'INCOME', 55400000],
  ['a-sal', 'SALARIES', 'Salaries and wages', 'EXPENSE', 17460000], ['a-paye', 'PAYE_PAYABLE', 'PAYE payable', 'LIABILITY', 1571400],
].map(([id, code, name, type, bal]) => ({ id, code, name, type, debits: String(bal), credits: '0', balance: String(bal) }));
on('GET', /^\/ledger\/accounts$/, () => ACCOUNTS);
on('GET', /^\/fees\/outstanding$/, () => INVOICES.filter((i) => +i.outstanding > 0).map((i) => ({ invoiceId: i.id, invoiceNumber: i.invoiceNumber, studentId: i.studentId, studentName: i.studentName, admissionNumber: i.admissionNumber, termName: 'First Term', issueDate: i.issueDate, dueDate: i.dueDate, total: i.total, paid: i.paid, outstanding: i.outstanding })));
const rc = (n, id, name, adm, amt, method, on_, ref) => ({ id: 'rc' + n, receiptNumber: `RCT-2026-0${n}`, amount: String(amt), method, paidOn: on_, reference: ref, status: 'RECEIVED', payerName: null, studentId: 'st-' + id, admissionNumber: adm, studentName: name, allocated: String(amt), unallocated: '0' });
on('GET', /^\/fees\/payments$/, () => [
  rc(390, 'folake', 'Adewale, Folake', 'GFC/2024/0150', 185000, 'BANK_TRANSFER', '2026-09-23', 'ZEN-2309-1142'),
  rc(389, 'amina', 'Bello, Amina', 'GFC/2026/0012', 185000, 'CASH', '2026-09-22', null),
  rc(388, 'chuka', 'Eze, Chuka', 'GFC/2022/0077', 150000, 'POS', '2026-09-19', 'POS-88213'),
  rc(288, 'tobi', 'Adeyemi, Tobi', 'GFC/2025/0339', 100000, 'BANK_TRANSFER', '2026-09-12', 'GTB-1209-0071'),
]);
const TB = { asOf: '2026-09-24', rows: ACCOUNTS, totalDebits: '74943400', totalCredits: '74943400', difference: '0', balanced: true };
on('GET', /^\/ledger\/trial-balance$/, () => TB);
const JE = [
  { id: 'je913', entry_date: '2026-09-24', source_type: 'FEE_PAYMENT', source_id: 'rc391', description: 'Fee payment RCT-2026-0391 — Adeyemi, Tobi', reverses_entry_id: null, total: '85000' },
  { id: 'je912', entry_date: '2026-09-23', source_type: 'FEE_PAYMENT', source_id: 'rc390', description: 'Fee payment RCT-2026-0390 — Adewale, Folake', reverses_entry_id: null, total: '185000' },
  { id: 'je911', entry_date: '2026-09-22', source_type: 'EXPENSE', source_id: 'x77', description: 'Diesel for the generator', reverses_entry_id: null, total: '62000' },
  { id: 'je910', entry_date: '2026-09-22', source_type: 'FEE_PAYMENT', source_id: 'rc389', description: 'Fee payment RCT-2026-0389 — Bello, Amina', reverses_entry_id: null, total: '185000' },
];
on('GET', /^\/ledger\/entries$/, () => JE);
on('GET', /^\/ledger\/entries\/[^/]+$/, () => ({ ...JE[0], lines: [
  { id: 'jl1', debit: '85000', credit: '0', memo: null, account_code: 'BANK', account_name: 'GTBank — operating', account_type: 'ASSET' },
  { id: 'jl2', debit: '0', credit: '85000', memo: 'INV-2026-0413', account_code: 'FEES_RECEIVABLE', account_name: 'Fees receivable', account_type: 'ASSET' },
] }));

// ── Payroll and My Pay ────────────────────────────────────────────
const PP9 = { id: 'pp9', name: 'September 2026', startDate: '2026-09-01', endDate: '2026-09-30', paymentDate: '2026-09-25', status: 'PROCESSING', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-24T08:00:00Z' };
on('GET', /^\/pay-periods$/, () => [PP9, { ...PP9, id: 'pp8', name: 'August 2026', startDate: '2026-08-01', endDate: '2026-08-31', paymentDate: '2026-08-25', status: 'CLOSED' }, { ...PP9, id: 'pp7', name: 'July 2026', startDate: '2026-07-01', endDate: '2026-07-31', paymentDate: '2026-07-24', status: 'CLOSED' }]);
on('GET', /^\/pay-periods\/current$/, () => PP9);
on('GET', /^\/pay-periods\/[^/]+$/, () => PP9);
const staff = [['Amaka', 'Eze', 'GFC-E-014', 'Educator', 515000, 102500], ['Grace', 'Ade', 'GFC-E-003', 'Registrar', 480000, 95300], ['Yusuf', 'Garba', 'GFC-E-021', 'Bursar', 455000, 89900], ['Ngozi', 'Okafor', 'GFC-E-030', 'Educator', 430000, 84100], ['Emeka', 'Nwosu', 'GFC-E-032', 'Educator', 430000, 84100], ['Halima', 'Sani', 'GFC-E-040', 'Teaching Assistant', 260000, 41800]];
const SAL = staff.map(([f, l, no, role, g, d], i) => ({ id: 'sal' + i, employeeId: 'e' + i, employee: { id: 'e' + i, employeeNumber: no, firstName: f, lastName: l, middleName: null, email: '', phone: '', role: { name: role } }, payPeriodId: 'pp9', grossSalary: g, totalDeductions: d, netSalary: g - d, calculatedAt: '2026-09-22T09:00:00Z', approvedBy: 'u1', approvedAt: '2026-09-23T15:00:00Z', status: 'APPROVED', paymentReference: null, notes: null, createdAt: '', updatedAt: '' }));
on('GET', /^\/payroll\/salaries$/, () => ({ items: SAL, total: 64, page: 1, limit: 20, totalPages: 4 }));
on('GET', /^\/payroll\/salaries\/status-summary$/, () => ({ total: 64, byStatus: { APPROVED: { count: 64, gross: '17460000', deductions: '2640000', net: '14820000' } } }));
on('GET', /^\/me\/employee$/, () => ({ id: 'e1', employeeNumber: 'GFC-E-014', firstName: 'Amaka', lastName: 'Eze', email: 'amaka.eze@greenfield.edu.ng', phone: '0803 000 1122', dateOfBirth: null, gender: 'FEMALE', address: null, nin: null, bvn: null, tin: null, taxState: 'Lagos', lasrraId: null, rsaPin: null, pfaName: null, nhfNumber: null, nextOfKinName: null, nextOfKinPhone: null, nextOfKinRelationship: null, joinDate: '2021-09-06', status: 'ACTIVE', role: 'Educator', department: 'Teaching', grade: { code: 'T3', name: 'Senior Educator' } }));
on('GET', /^\/me\/payslips$/, () => [['September 2026', 412500, '2026-09-25'], ['August 2026', 412500, '2026-08-25'], ['July 2026', 405200, '2026-07-24']].map(([p, n, d], i) => ({ id: 'ps' + i, fileName: `payslip-${i}.pdf`, status: 'GENERATED', generatedAt: d + 'T10:00:00Z', payPeriod: p, netSalary: n, reference: `PAY-2026-0${9 - i}-014` })));
on('GET', /^\/me\/ytd/, () => ({ year: 2026, contractualSalary: 4635000, additionalEarnings: 0, grossSalary: 4635000, totalDeductions: 922500, netSalary: 3712500, deductionsByComponent: { 'PAYE tax': 614700, 'Pension (8%)': 307800 }, periodsIncluded: 9 }));
on('GET', /^\/me\/loans$/, () => []);
