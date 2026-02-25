import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'sha256';
const DIGEST_ENCODING = 'hex';

/** Minimum key size in bytes after decoding (32 hex chars). */
const MIN_KEY_BYTES = 16;

/**
 * Returns the server secret used to key HMAC for invite tokens.
 * INVITE_TOKEN_SECRET must be hex-encoded (e.g. `openssl rand -hex 32`).
 * The key is decoded from hex to raw bytes before use in HMAC.
 */
function getInviteTokenSecret(): string {
	const secret = env.INVITE_TOKEN_SECRET ?? process.env.INVITE_TOKEN_SECRET;
	if (!secret || secret.length < 32) {
		throw new Error(
			'INVITE_TOKEN_SECRET must be set and at least 32 hex characters (16 bytes) for workspace invite tokens'
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(secret)) {
		throw new Error('INVITE_TOKEN_SECRET must be hex-encoded (only 0-9, a-f, A-F)');
	}
	return secret;
}

/**
 * Converts a hex-encoded secret string to a Buffer for use as HMAC key.
 * The key parameter is a string (hex); it is converted to raw bytes before HMAC.
 */
function secretToKeyBuffer(key: string): Buffer {
	const keyBuf = Buffer.from(key, 'hex');
	if (keyBuf.length < MIN_KEY_BYTES) {
		throw new Error(
			`INVITE_TOKEN_SECRET must decode to at least ${MIN_KEY_BYTES} bytes (got ${keyBuf.length})`
		);
	}
	return keyBuf;
}

/**
 * Computes HMAC-SHA256 digest of the raw invite token for storage and lookup.
 * Only the digest is stored in the database; the raw token is sent to the user (e.g. in link/email).
 */
export function hashInviteToken(rawToken: string): string {
	if (!rawToken) throw new Error('rawToken must be a non-empty string');
	const key = getInviteTokenSecret();
	const keyBuf = secretToKeyBuffer(key);
	return createHmac(ALGORITHM, keyBuf).update(rawToken, 'utf8').digest(DIGEST_ENCODING);
}
