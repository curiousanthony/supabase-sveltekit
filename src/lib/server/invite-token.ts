import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'sha256';
const DIGEST_ENCODING = 'hex';

/**
 * Returns the server secret used to key HMAC for invite tokens.
 * Set INVITE_TOKEN_SECRET in environment (e.g. 32+ random bytes in hex or base64).
 */
function getInviteTokenSecret(): string {
	const secret = env.INVITE_TOKEN_SECRET ?? process.env.INVITE_TOKEN_SECRET;
	if (!secret || secret.length < 16) {
		throw new Error(
			'INVITE_TOKEN_SECRET must be set and at least 16 characters for workspace invite tokens'
		);
	}
	return secret;
}

/**
 * Computes HMAC-SHA256 digest of the raw invite token for storage and lookup.
 * Only the digest is stored in the database; the raw token is sent to the user (e.g. in link/email).
 */
export function hashInviteToken(rawToken: string): string {
	const key = getInviteTokenSecret();
	return createHmac(ALGORITHM, key).update(rawToken, 'utf8').digest(DIGEST_ENCODING);
}
