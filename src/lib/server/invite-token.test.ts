import { describe, it, expect, vi } from 'vitest';

const TEST_SECRET = '0123456789abcdef0123456789abcdef';

vi.mock('$env/dynamic/private', () => ({
	env: { INVITE_TOKEN_SECRET: TEST_SECRET }
}));

const { hashInviteToken } = await import('$lib/server/invite-token');

describe('hashInviteToken', () => {
	it('same raw token yields same digest (create and lookup match)', () => {
		const rawToken = 'abc-123-invite';
		const digest1 = hashInviteToken(rawToken);
		const digest2 = hashInviteToken(rawToken);
		expect(digest1).toBe(digest2);
		expect(digest1).toMatch(/^[0-9a-f]{64}$/);
	});

	it('different raw tokens yield different digests', () => {
		const d1 = hashInviteToken('token-a');
		const d2 = hashInviteToken('token-b');
		expect(d1).not.toBe(d2);
	});

	it('digest is hex and fixed length (SHA-256)', () => {
		const digest = hashInviteToken('any-token');
		expect(digest).toMatch(/^[0-9a-f]{64}$/);
		expect(digest.length).toBe(64);
	});

	it('empty string throws', () => {
		expect(() => hashInviteToken('')).toThrow('rawToken must be a non-empty string');
	});
});
