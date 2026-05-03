import { describe, expect, it } from 'vitest';
import { assertValidAgentSlug, toAgentSlug } from '../slug';

describe('agent slug helpers', () => {
    it.each([
        ['myapp', 'myapp', true],
        ['MyApp', 'myapp', true],
        ['my_app', 'my-app', true],
        ['Has Spaces', 'has-spaces', true],
        ['multi__under___score', 'multi-under-score', true],
        ['--leading-trail--', 'leading-trail', true],
        ['123!@#$%^abc', '123-abc', true],
        ['!@#$%', '', false],
        ['___', '', false],
        ['', '', false]
    ])('normalizes %j to %j', (rawName, expectedSlug, isValid) => {
        const slug = toAgentSlug(rawName);

        expect(slug).toBe(expectedSlug);
        if (isValid) {
            expect(() => assertValidAgentSlug(slug)).not.toThrow();
        } else {
            expect(() => assertValidAgentSlug(slug)).toThrow('Invalid agent slug');
        }
    });
});
