import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formations, formationDocuments } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getQuestProgress, getQuestsForFormation, calculateDueDates } from '$lib/formation-quests';
import { getComplianceWarnings } from '$lib/compliance-warnings';
import { getEffectiveStatus } from '$lib/services/document-lifecycle';
import type { LayoutServerLoad } from './$types';

const STATUT_COLORS: Record<string, string> = {
	'À traiter': '[&_svg]:text-neutral-400',
	'Signature convention': '[&_svg]:text-orange-400',
	'Financement': '[&_svg]:text-yellow-400',
	'Planification': '[&_svg]:text-purple-400',
	'En cours': '[&_svg]:text-blue-400',
	'Terminée': '[&_svg]:text-green-400',
	'Archivée': '[&_svg]:text-red-400'
};

export const load = (async ({ params, depends }) => {
	depends(`formation:${params.id}`);
	const formationId = params.id;

	const formation = await db.query.formations.findFirst({
		where: eq(formations.id, formationId),
		with: {
			thematique: { columns: { id: true, name: true } },
			sousthematique: { columns: { id: true, name: true } },
			client: { columns: { id: true, legalName: true } },
			company: { columns: { id: true, name: true } },
			programmeSource: {
				columns: {
					id: true,
					titre: true,
					dureeHeures: true,
					modalite: true,
					objectifs: true,
					publicVise: true,
					prerequis: true,
					prixPublic: true,
					updatedAt: true,
					topicId: true,
					derivedFromProgrammeId: true
				}
			},
			modules: {
				columns: {
					id: true,
					createdAt: true,
					name: true,
					durationHours: true,
					objectifs: true,
					contenu: true,
					modaliteEvaluation: true,
					sourceModuleId: true,
					orderIndex: true,
					formateurId: true
				},
				orderBy: (m, { asc }) => [asc(m.orderIndex)],
				with: {
					formateur: {
						columns: { id: true },
						with: {
							user: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } }
						}
					},
					moduleSupports: {
						with: {
							support: {
								columns: { id: true, titre: true, url: true, fileName: true, mimeType: true }
							}
						}
					},
					moduleQuestionnaires: {
						with: {
							questionnaire: {
								columns: { id: true, titre: true, type: true, urlTest: true }
							}
						}
					}
				}
			},
			actions: {
				columns: {
					id: true,
					title: true,
					description: true,
					status: true,
					etape: true,
					phase: true,
					questKey: true,
					assigneeId: true,
					guidanceDismissed: true,
					dueDate: true,
					completedAt: true,
					blockedByActionId: true,
					orderIndex: true,
					waitStartedAt: true,
					lastRemindedAt: true,
					anticipatedAt: true,
					softLockOverriddenAt: true
				},
				orderBy: (a, { asc }) => [asc(a.orderIndex)],
				with: {
					subActions: {
						columns: {
							id: true,
							title: true,
							description: true,
							completed: true,
							completedAt: true,
							orderIndex: true,
							ctaType: true,
							ctaLabel: true,
							ctaTarget: true,
							documentRequired: true,
							acceptedFileTypes: true
						},
						orderBy: (s, { asc }) => [asc(s.orderIndex)],
						with: {
							document: {
								columns: { id: true, fileName: true, fileType: true, fileSize: true, storagePath: true, uploadedAt: true }
							}
						}
					},
					assignee: {
						columns: { id: true, firstName: true, lastName: true, avatarUrl: true }
					},
					comments: {
						columns: { id: true, content: true, createdAt: true },
						with: { user: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
						orderBy: (c, { asc }) => [asc(c.createdAt)]
					}
				}
			},
			formationFormateurs: {
				with: {
					formateur: {
						columns: { id: true },
						with: {
							user: { columns: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } }
						}
					}
				}
			},
			formationApprenants: {
				with: {
					contact: {
						columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
						with: {
							contactCompanies: {
								with: {
									company: { columns: { id: true, name: true } }
								},
								limit: 1
							}
						}
					}
				}
			},
			seances: {
				columns: {
					id: true,
					startAt: true,
					endAt: true,
					location: true,
					room: true,
					moduleId: true,
					formateurId: true,
					modalityOverride: true
				},
				orderBy: (s, { asc }) => [asc(s.startAt)],
				with: {
					module: { columns: { id: true, name: true } },
					formateur: {
						columns: { id: true },
						with: {
							user: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } }
						}
					},
					emargements: {
						columns: { id: true, contactId: true, formateurId: true, signerType: true, period: true, signedAt: true, signatureToken: true }
					}
				}
			},
		invoices: {
			columns: { id: true, status: true, dueDate: true }
		},
		dealsFromFormation: {
			columns: { id: true, name: true }
		},
		auditLog: {
			columns: {
				id: true,
				actionType: true,
				entityType: true,
				entityId: true,
				fieldName: true,
				oldValue: true,
				newValue: true,
				createdAt: true
			},
			orderBy: (a, { desc }) => [desc(a.createdAt)],
			limit: 50,
			with: {
				user: {
					columns: { id: true, firstName: true, lastName: true, avatarUrl: true }
				}
			}
		}
		}
	});

	if (!formation) {
		throw error(404, 'Formation introuvable');
	}

	const statutBadgeClass = STATUT_COLORS[formation.statut] ?? '[&_svg]:text-neutral-400';

	const questProgressData = getQuestProgress(formation.actions ?? []);
	const questProgress = questProgressData.overall.percent;
	const formateurName =
		formation.formationFormateurs?.[0]?.formateur?.user != null
			? [formation.formationFormateurs[0].formateur.user.firstName, formation.formationFormateurs[0].formateur.user.lastName]
					.filter(Boolean)
					.join(' ') || formation.formationFormateurs[0].formateur.user.email || null
			: null;

	const formationData = {
		name: formation.name ?? 'Formation',
		idInWorkspace: formation.idInWorkspace,
		type: formation.type,
		modalite: formation.modalite,
		duree: formation.duree,
		dateDebut: formation.dateDebut,
		dateFin: formation.dateFin,
		clientName: formation.company?.name ?? formation.client?.legalName ?? null,
		formateurName,
		statut: formation.statut
	};

	const header = {
		pageName: formation.name ?? 'Formation',
		idInWorkspace: formation.idInWorkspace,
		idPrefix: 'FOR-' as const,
		actions: [
			{
				type: 'badge' as const,
				icon: 'circle',
				text: formation.statut,
				variant: 'outline' as const,
				className: statutBadgeClass + ' select-none'
			},
		{
			type: 'formationButtonGroup' as const,
			formationId: formation.id,
			formationData,
			questProgress,
			historyEntries: formation.auditLog ?? []
		}
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	const today = new Date().toISOString().slice(0, 10);
	const applicableQuests = getQuestsForFormation(
		formation.type as 'Intra' | 'Inter' | 'CPF' | null | undefined,
		formation.typeFinancement as 'CPF' | 'OPCO' | 'Inter' | 'Intra' | null | undefined
	);
	const dynamicDueDates = calculateDueDates(applicableQuests, formation.dateDebut, formation.dateFin);
	const overdueQuests =
		(formation.actions ?? []).some((a) => {
			const dd = a.questKey ? dynamicDueDates.get(a.questKey) ?? a.dueDate : a.dueDate;
			return dd != null && dd < today && a.status !== 'Terminé';
		}) ?? false;

	const nowIso = new Date().toISOString();

	const missingSignatures =
		(formation.seances ?? []).some((seance) => {
			const seanceEnd = seance.endAt ? new Date(seance.endAt).toISOString() : null;
			if (!seanceEnd || seanceEnd > nowIso) return false;
			const emargements = seance.emargements ?? [];
			return emargements.some((e) => e.signedAt == null);
		}) ?? false;

	const missingFormateurDocs =
		(formation.actions ?? []).some(
			(a) =>
				a.questKey === 'documents_formateur' &&
				a.status !== 'Terminé' &&
				(a.subActions ?? []).some((sa) => !sa.completed)
		) ?? false;

	const unsignedEmargements =
		(formation.seances ?? []).some((seance) => {
			if (!seance.endAt || new Date(seance.endAt).toISOString() > nowIso) return false;
			return (seance.emargements ?? []).some((e) => e.signedAt == null);
		}) ?? false;

	const overdueInvoices =
		(formation.invoices ?? []).some(
			(inv) => inv.status !== 'Payée' && inv.dueDate != null && inv.dueDate < today
		) ?? false;

	let programmeSourceUpdatedSinceLink = false;
	if (formation.programmeSource?.updatedAt) {
		const sourceUpdated = new Date(formation.programmeSource.updatedAt).getTime();
		const linkedModules = (formation.modules ?? []).filter((m) => m.sourceModuleId);
		if (linkedModules.length > 0) {
			const oldestLinkedModule = Math.min(
				...linkedModules.map((m) => new Date(m.createdAt ?? 0).getTime())
			);
			programmeSourceUpdatedSinceLink = sourceUpdated > oldestLinkedModule;
		}
	}

	const docStatuses = await db.query.formationDocuments.findMany({
		where: eq(formationDocuments.formationId, formationId),
		columns: { type: true, status: true, expiresAt: true }
	});
	const docInputs = docStatuses.map((d) => ({
		type: d.type,
		effectiveStatus: getEffectiveStatus({ type: d.type, status: d.status, expiresAt: d.expiresAt })
	}));
	const complianceWarnings = getComplianceWarnings(docInputs, formation.dateDebut);

	return {
		formation,
		pageName: formation.name ?? 'Formation',
		header,
		overdueQuests,
		missingSignatures,
		missingFormateurDocs,
		unsignedEmargements,
		overdueInvoices,
		questProgress: questProgressData,
		programmeSourceUpdatedSinceLink,
		complianceWarnings
	};
}) satisfies LayoutServerLoad;
