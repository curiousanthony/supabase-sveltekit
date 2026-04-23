import { db } from '$lib/db';
import { formateurs, formateursThematiques, formateursSousthematiques, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export interface CreateFormateurInput {
	workspaceId: string;
	firstName: string | null;
	lastName: string | null;
	email?: string | null;
	ville?: string | null;
	departement?: string | null;
	thematiqueIds?: string[];
	sousthematiqueIds?: string[];
}

export interface CreateFormateurResult {
	formateurId: string;
	userId: string;
}

/**
 * Creates a user + formateur pair for a workspace, optionally linking thématiques and sous-thématiques.
 * Reuses an existing user row when the email already exists.
 * Generates a placeholder email when none is provided (users.email is NOT NULL).
 */
export async function createFormateurForWorkspace(
	input: CreateFormateurInput
): Promise<CreateFormateurResult> {
	const { workspaceId, firstName, lastName, ville, departement, thematiqueIds, sousthematiqueIds } =
		input;

	const email = input.email?.trim() || `formateur.${Date.now()}@noreply.internal`;

	let userId: string;
	const [insertedUser] = await db
		.insert(users)
		.values({ firstName, lastName, email })
		.onConflictDoNothing()
		.returning({ id: users.id });

	if (insertedUser) {
		userId = insertedUser.id;
	} else {
		const existing = await db.query.users.findFirst({
			where: eq(users.email, email),
			columns: { id: true }
		});
		if (!existing) {
			throw new Error('Impossible de créer le formateur. Veuillez réessayer.');
		}
		userId = existing.id;
	}

	const [row] = await db
		.insert(formateurs)
		.values({ userId, workspaceId, ville: ville ?? null, departement: departement ?? null })
		.returning({ id: formateurs.id });

	if (!row) {
		throw new Error('Impossible de créer le formateur. Veuillez réessayer.');
	}

	const formateurId = row.id;

	if (thematiqueIds && thematiqueIds.length > 0) {
		await db
			.insert(formateursThematiques)
			.values(thematiqueIds.map((thematiqueId) => ({ formateurId, thematiqueId })))
			.onConflictDoNothing();
	}

	if (sousthematiqueIds && sousthematiqueIds.length > 0) {
		await db
			.insert(formateursSousthematiques)
			.values(sousthematiqueIds.map((sousthematiqueId) => ({ formateurId, sousthematiqueId })))
			.onConflictDoNothing();
	}

	return { formateurId, userId };
}
