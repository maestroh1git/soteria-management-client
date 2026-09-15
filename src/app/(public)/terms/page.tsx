import type { Metadata } from 'next';
import { LegalDocument, Placeholder, Section } from '@/components/legal/legal-document';

export const metadata: Metadata = {
    title: 'Terms of service',
    description:
        'The terms on which Soteria is provided to a school, and what each side is responsible for.',
};

/**
 * NOT LEGAL ADVICE. A starting point that states the real arrangement —
 * particularly who owns the data and what happens to it when a school leaves,
 * which is the clause a school will actually care about. Have counsel review it
 * and fill every placeholder before offering the service.
 */
export default function TermsPage() {
    return (
        <LegalDocument
            title="Terms of service"
            updated="15 September 2026"
            intro="These terms govern a school's use of Soteria. They are between the school and the provider; parents and staff use the service through their school."
        >
            <Section title="Who these terms are between">
                <p>
                    Between <Placeholder>LEGAL ENTITY NAME</Placeholder> (&ldquo;we&rdquo;)
                    and the school that has subscribed (&ldquo;the school&rdquo;).
                </p>
                <p>
                    Parents, guardians and staff use the service through an account the
                    school creates. Their relationship over the data is with the school.
                </p>
            </Section>

            <Section title="What the service is">
                <p>
                    Software for running a school: admissions and enrolment, a pupil
                    register, fee billing and collection, payroll with statutory
                    deductions, expenses, a ledger, and portals for staff and parents.
                </p>
                <p>
                    It is <strong>not</strong> an accountant, a payroll bureau, or a tax
                    adviser. It calculates from the rules the school configures. The
                    school remains responsible for whether those rules are correct and
                    for what it files and remits.
                </p>
            </Section>

            <Section title="The school's responsibilities">
                <ul>
                    <li>
                        Keeping accounts accurate, and removing access promptly when
                        someone leaves.
                    </li>
                    <li>
                        Having a lawful basis for the personal data it records,
                        particularly children&apos;s medical information.
                    </li>
                    <li>
                        <strong>Checking payroll before approving it.</strong> Approval
                        is the point at which figures post to the ledger and are treated
                        as owed. The service warns where it can — for example when a run
                        finds no tax rule in force — but the school approves.
                    </li>
                    <li>Keeping its own copies of anything it is required to retain.</li>
                </ul>
            </Section>

            <Section title="Our responsibilities">
                <ul>
                    <li>
                        Providing the service with reasonable skill and care, and
                        keeping each school&apos;s data separate from every other
                        school&apos;s.
                    </li>
                    <li>
                        Processing personal data only on the school&apos;s instructions,
                        as described in the{' '}
                        <a href="/privacy" className="underline">
                            privacy policy
                        </a>
                        .
                    </li>
                    <li>
                        Telling the school without undue delay if its data is exposed.
                    </li>
                    <li>
                        Targeting <Placeholder>UPTIME COMMITMENT</Placeholder>{' '}
                        availability, excluding announced maintenance.
                    </li>
                </ul>
            </Section>

            <Section title="The school's data belongs to the school">
                <p>
                    The school owns everything it puts in. We claim no ownership of it
                    and do not use it to train anything or to build products.
                </p>
                <p>
                    The school can export payroll reports, payslips, invoices and
                    receipts from the application at any time.
                </p>
                <p>
                    A <strong>complete</strong> export — the roll, guardians, the fee
                    ledger and payroll history together — is produced by us on request,
                    in a machine-readable format, within{' '}
                    <Placeholder>EXPORT TURNAROUND</Placeholder> of asking. It is not
                    yet a button in the application, and we would rather say so than
                    imply one exists. The right to ask does not depend on why the school
                    is asking, and applies while the subscription is live and for{' '}
                    <Placeholder>EXPORT WINDOW AFTER TERMINATION</Placeholder> after it
                    ends.
                </p>
                <p>
                    After that window the data is deleted from live systems, and from
                    backups within{' '}
                    <Placeholder>BACKUP RETENTION PERIOD</Placeholder>.
                </p>
            </Section>

            <Section title="Fees">
                <p>
                    Charges, billing period and notice of price changes:{' '}
                    <Placeholder>COMMERCIAL TERMS</Placeholder>. Unpaid fees may lead to
                    suspension after notice; suspension does not delete data.
                </p>
            </Section>

            <Section title="Ending the arrangement">
                <p>
                    Either side may end it with{' '}
                    <Placeholder>NOTICE PERIOD</Placeholder> notice. We may suspend an
                    account immediately where it is being used unlawfully or is
                    endangering the service for others; we will say why.
                </p>
            </Section>

            <Section title="Liability">
                <p>
                    Nothing here limits liability that cannot lawfully be limited.
                    Subject to that,{' '}
                    <Placeholder>LIABILITY CAP — CONFIRM WITH COUNSEL</Placeholder>.
                </p>
                <p>
                    The service is a tool for producing figures, not a warranty of them.
                    Payroll, tax and fee calculations depend on what the school
                    configures.
                </p>
            </Section>

            <Section title="Governing law">
                <p>
                    <Placeholder>GOVERNING LAW AND JURISDICTION</Placeholder>.
                </p>
            </Section>
        </LegalDocument>
    );
}
