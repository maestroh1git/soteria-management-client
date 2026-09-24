import { mkdirSync, writeFileSync } from 'fs';
import { API_URL, AUTH_DIR, loadPersonas, storageFor } from './personas';

/**
 * Sign every persona in once, and save the session the way the login page
 * would leave it: the token in localStorage (read by the API client), the
 * persisted auth store (read by the UI), and the cookies the middleware reads.
 *
 * Through the API rather than the form, and paced: the auth controller allows
 * five requests a minute per address, and there are a dozen personas. The
 * form itself is exercised once, in personas.spec.ts.
 */
export default async function globalSetup() {
    const personas = loadPersonas();
    const origin = new URL(process.env.CLIENT_URL ?? 'http://localhost:3001');
    mkdirSync(AUTH_DIR, { recursive: true });

    for (const persona of personas) {
        const { token, user } = await signIn(persona.email, persona.password);
        const cookie = (name: string, value: string) => ({
            name,
            value,
            domain: origin.hostname,
            path: '/',
            expires: Math.floor(Date.now() / 1000) + 3600,
            httpOnly: false,
            secure: false,
            sameSite: 'Lax' as const,
        });
        writeFileSync(
            storageFor(persona.key),
            JSON.stringify({
                cookies: [
                    cookie('auth-token', 'true'),
                    cookie(
                        'user-roles',
                        encodeURIComponent(JSON.stringify(user.systemRoles)),
                    ),
                ],
                origins: [
                    {
                        origin: origin.origin,
                        localStorage: [
                            { name: 'auth-token', value: token },
                            {
                                name: 'auth-store',
                                value: JSON.stringify({
                                    state: { user, token, isAuthenticated: true },
                                    version: 0,
                                }),
                            },
                        ],
                    },
                ],
            }),
        );
    }
}

async function signIn(
    email: string,
    password: string,
): Promise<{ token: string; user: { systemRoles: string[] } }> {
    for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (res.status === 429) {
            const wait = Number(res.headers.get('retry-after') ?? 15);
            await new Promise((r) => setTimeout(r, (wait + 1) * 1000));
            continue;
        }
        if (!res.ok) {
            throw new Error(`Sign-in failed for ${email}: ${res.status} ${await res.text()}`);
        }
        return res.json();
    }
    throw new Error(`Sign-in for ${email} was throttled six times running`);
}
