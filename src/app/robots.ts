import type { MetadataRoute } from 'next';

/**
 * Almost all of this app is behind a login, and the parts that are not are
 * per-family links carrying a token. None of it should be in a search index;
 * the admissions form is the one page a school may legitimately want found.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/apply/', disallow: '/' },
        ],
    };
}
