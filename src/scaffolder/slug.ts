const AGENT_SLUG_PATTERN = /^[a-z0-9-]+$/;

export function toAgentSlug(rawName: string): string {
    return rawName
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function assertValidAgentSlug(slug: string): void {
    if (!slug || !AGENT_SLUG_PATTERN.test(slug)) {
        throw new Error(`Invalid agent slug "${slug}": expected non-empty /^[a-z0-9-]+$/`);
    }
}
