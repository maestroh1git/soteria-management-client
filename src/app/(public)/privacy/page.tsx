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
                    <strong>Amaku Solutions Ltd</strong> provides the software
                    and stores the data on the school&apos;s behalf — the{' '}
                    <strong>data processor</strong>. We do not decide what is collected.
                    We do not sell it, use it for advertising, or use it to train
                    anything. We do count it: see{' '}
                    <em>What we can see across schools</em> below.
                </p>
                <p>
                    Registered address: <Placeholder>FULL STREET ADDRESS, Lagos, Nigeria</Placeholder>.
                    Data protection contact:{' '}
                    <strong>Hello@amakusolutions.com</strong>.
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
                    <li>fees billed, paid and outstanding;</li>
                    <li>
                        <strong>attendance</strong> — whether the child was present,
                        late, away or excused on each teaching day, and the reason
                        recorded when they were not in school. A register is never
                        overwritten: when a mark is corrected, the original is kept
                        alongside it, with who changed it and when;
                    </li>
                    <li>
                        <strong>leaving school during the day</strong> — the time, the
                        adult who collected the child, the member of staff who
                        authorised it, the reason, and the time the child returned.
                        Where a child is released to an adult the school has recorded
                        as not permitted to collect them, the written reason given is
                        kept as part of that record;
                    </li>
                    <li>awards and commendations the school records.</li>
                </ul>
                <p>About a parent or guardian:</p>
                <ul>
                    <li>name, relationship to the child, phone number and email;</li>
                    <li>
                        whether you are permitted to collect the child from school;
                    </li>
                    <li>payments you have made;</li>
                    <li>
                        that you collected a child from school during the day, and
                        when.
                    </li>
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
                        children, their fees and what is owed, their attendance and any
                        awards, and nothing belonging to another family.
                    </li>
                    <li>
                        <strong>Not everything about attendance reaches the portal.</strong>{' '}
                        A register carries a reason for an absence — &ldquo;illness&rdquo;,
                        &ldquo;appointment&rdquo; — and the school may also add an
                        internal note against it, which can contain health detail. You
                        are shown the reason. The school&apos;s internal note is never
                        sent to the portal.
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

            <Section title="What we can see across schools">
                <p>
                    We keep an operational view across all schools using the service. It
                    shows <strong>counts and totals only</strong> — how many schools,
                    how many staff, and the total value of salaries paid — so we can run
                    and support the service. It does not show any individual&apos;s
                    name, record, pay or fees.
                </p>
                <p>
                    We also keep a log of significant actions across schools, used to
                    investigate faults and suspected misuse.
                </p>
            </Section>

            <Section title="Links that open without a login">
                <p>
                    Some documents are reached by a link containing a long random code
                    rather than by signing in — a fee invoice or receipt sent to a
                    parent, and a payslip sent to a member of staff. Anyone holding that
                    link can open that one document, so treat it as you would the
                    document itself. The link opens nothing else, and gives no access to
                    any other child, parent or member of staff.
                </p>
            </Section>

            <Section title="Cookies">
                <p>
                    Signing in sets a small number of cookies so the service knows you
                    are signed in, which school you belong to, and whether you still
                    need to change your password. They are required for the service to
                    work and are not used to track you or to advertise. Signing out
                    removes them.
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
                    <strong>Railway</strong>, in{' '}
                    <Placeholder>HOSTING REGION — CONFIRM</Placeholder>, and email is
                    sent through <strong>Postmark</strong>. These providers process data
                    on our instructions only.
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
                    period Nigerian tax and employment law requires. Attendance
                    registers and records of a child leaving school during the day are
                    kept beyond the child&apos;s time at the school, because they are
                    the school&apos;s evidence of where a child was on a given day.
                </p>
                <p>
                    The principle is the same across all of it: nothing is kept for
                    longer than the school has a reason to keep it, and the school —
                    not us — sets the actual periods and can tell you what they are for
                    your child. We hold the data on their instructions and delete it
                    when they tell us to.
                </p>
                <p>
                    One deletion is built in: an{' '}
                    <strong>unsuccessful admission application</strong> is deleted once
                    it passes the retention date the school sets for it, along with the
                    documents attached to it. A child who was never offered a place does
                    not stay on file indefinitely. The school triggers this, so ask them
                    when it last ran if it matters to you.
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
                    <strong>Hello@amakusolutions.com</strong>. You may also complain
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
