import { readFileSync } from 'fs';
import path from 'path';

/** One entry from the API's `npm run seed:personas -- --out=…` file. */
export interface Persona {
    key: string;
    label: string;
    email: string;
    password: string;
    roles: string[];
    note?: string;
}

export const API_URL = process.env.API_URL ?? 'http://localhost:3000/api';
export const AUTH_DIR = path.join(__dirname, '.auth');

export function loadPersonas(): Persona[] {
    const file = process.env.PERSONAS_FILE;
    if (!file) {
        throw new Error(
            'Set PERSONAS_FILE to the JSON written by the API\'s ' +
                '`npm run seed:personas -- --out=<file>`. See e2e/README.md.',
        );
    }
    const { personas } = JSON.parse(readFileSync(file, 'utf8')) as {
        personas: Persona[];
    };
    // The owner's password is whatever they registered with; the seed does
    // not know it, so the owner is not part of the smoke run.
    return personas.filter((p) => p.key !== 'owner');
}

export const storageFor = (key: string) => path.join(AUTH_DIR, `${key}.json`);
