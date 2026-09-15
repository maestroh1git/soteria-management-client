import type { Metadata } from 'next';
import { LegalDocument, Placeholder, Section } from '@/components/legal/legal-document';

export const metadata: Metadata = {
    title: 'Privacy policy',
    description:
        'What Soteria records about pupils, parents and staff, why, and who can see it.',
};

/**
 * Written against what the system actually does, not from a template: the
 * categories below are the real tables, and the retention and access claims are
 * the real behaviour. The bracketed placeholders are the things only the
 * operator can supply, and they are deliberately visible on the page — a policy
 * that is obviously unfinished is safer than one that reads as complete and is
 * wrong about who the controller is.
 *
 * NOT LEGAL ADVICE. Have a Nigerian data-protection practitioner review this
 * against the NDPA 2023 before relying on it.
 */
export default function PrivacyPolicyPage() {
    return (
        <LegalDocument
            title="Privacy policy"
            updated="15 September 2026"
            intro="Soteria is school administration software. It holds records about children, their parents and guardians, and school staff. This explains what it holds, why, and who can see it."
        >
            <Section title="Who is responsible for your data">
                <p>
                    Your child&apos;s school decides what is recorded and who at the
                    school may see it. In data-protection terms the school is the{' '}
                    <strong>data controller</strong>.
                </p>
                <p>
                    <Placeholder>LEGAL ENTITY NAME</Placeholder> provides the software
                    and stores the data on the school&apos;s behalf — the{' '}
                    <strong>data processor</strong>. We do not decide what is collected
                    and we do not use it for our own purposes.
                </p>
                <p>
                    Registered address: <Placeholder>REGISTERED ADDRESS</Placeholder>.
                    Data protection contact:{' '}
                    <Placeholder>DPO EMAIL ADDRESS</Placeholder>.
                </p>
            </Section>

            <Section title="What is recorded">
                <p>About a pupil:</p>
                <ul>
                    <li>name, date of birth, gender, admission number and class;</li>
                    <li>
                        admission application details, and the school the child
                        attended before, where the school records it;
                    </li>
                    <li>
                        <strong>medical information</strong> where the school records
                        it — allergies, conditions, blood group and genotype. This is
                        sensitive personal data and is treated as such;
                    </li>
                    <li>fees billed, paid and outstanding.</li>
                </ul>
                <p>About a parent or guardian:</p>
                <ul>
                    <li>name, relationship to the child, phone number and email;</li>
                    <li>
                        whether you are permitted to collect the child from school;
                    </li>
                    <li>payments you have made.</li>
                </ul>
                <p>About a member of staff:</p>
                <ul>
                    <li>
                        name, date of birth, contact details, role, grade and start
                        date;
                    </li>
                    <li>
                        salary, allowances, deductions, tax, pension and loans or
                        salary advances;
                    </li>
                    <li>
                        bank account details for salary payment, and national
                        identifiers (NIN, BVN) where the school records them;
                    </li>
                    <li>leave taken and requested.</li>
                </ul>
            </Section>

            <Section title="Why it is held">
                <p>
                    To run the school: to enrol and teach children, to bill and collect
                    fees, to pay staff and account for tax and pension, and to contact
                    a parent about their child. Where a school is required by law or by
                    a regulator to keep a record, that obligation is the reason it is
                    kept.
                </p>
                <p>
                    It is <strong>not</strong> used for advertising, and it is not sold
                    or shared with anyone for marketing.
                </p>
            </Section>

            <Section title="Who can see it">
                <ul>
                    <li>
                        <strong>Staff at your child&apos;s school</strong>, according to
                        their role. A teacher does not see payroll; a payroll officer
                        does not see medical records.
                    </li>
                    <li>
                        <strong>You</strong>, through the parent portal: your own
                        children, their fees and what is owed, and nothing belonging to
                        another family.
                    </li>
                    <li>
                        <strong>No other school.</strong> Each school&apos;s data is
                        separated at the database level, and that separation is
                        enforced by the database itself rather than by application code
                        remembering to ask.
                    </li>
                    <li>
                        <strong>Our technical staff</strong>, only where needed to
                        operate or repair the service.
                    </li>
                </ul>
                <p>
                    Reads of a child&apos;s medical record are written to an audit log.
                </p>
            </Section>

            <Section title="How it is protected">
                <ul>
                    <li>
                        Passwords are stored as bcrypt hashes. We cannot read your
                        password and neither can your school.
                    </li>
                    <li>
                        Invitation and password-reset links are stored only as hashes,
                        expire, and stop working once used.
                    </li>
                    <li>Data is encrypted in transit (HTTPS).</li>
                    <li>
                        Access is separated by school at the database level and by role
                        within a school.
                    </li>
                </ul>
            </Section>

            <Section title="Where it is held, and by whom">
                <p>
                    The service runs on infrastructure provided by{' '}
                    <Placeholder>HOSTING PROVIDER AND REGION</Placeholder>, and email is
                    sent through <Placeholder>EMAIL PROVIDER</Placeholder>. These
                    providers process data on our instructions only.
                </p>
                <p>
                    Where data is stored or processed outside Nigeria, that transfer is
                    made on the basis described in{' '}
                    <Placeholder>TRANSFER BASIS — CONFIRM WITH COUNSEL</Placeholder>.
                </p>
            </Section>

            <Section title="How long it is kept">
                <p>
                    School records are kept for as long as the school requires them,
                    which for a pupil&apos;s record is usually well beyond the time the
                    child is on the roll. Financial and payroll records are kept for the
                    period Nigerian tax and employment law requires. The specific
                    periods are set by your school:{' '}
                    <Placeholder>RETENTION SCHEDULE</Placeholder>.
                </p>
            </Section>

            <Section title="Your rights">
                <p>
                    Under the Nigeria Data Protection Act 2023 you may ask to see the
                    data held about you or your child, to have it corrected, to have it
                    deleted where there is no longer a reason to keep it, and to object
                    to how it is used.
                </p>
                <p>
                    Ask your child&apos;s school first — they decide what is held. If
                    they cannot resolve it, contact us at{' '}
                    <Placeholder>DPO EMAIL ADDRESS</Placeholder>. You may also complain
                    to the Nigeria Data Protection Commission.
                </p>
            </Section>

            <Section title="Children">
                <p>
                    Most of the people this service holds data about are children, and
                    they do not have accounts. A child&apos;s record is created and
                    managed by their school, and visible to their parent or guardian
                    through the parent portal.
                </p>
            </Section>

            <Section title="Changes">
                <p>
                    If this policy changes in a way that affects you, your school will
                    be told before the change takes effect.
                </p>
            </Section>
        </LegalDocument>
    );
}
