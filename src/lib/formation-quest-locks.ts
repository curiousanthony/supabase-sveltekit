export type LockType = 'hard' | 'soft';

export const DEPENDENCY_LOCK_TYPES: Record<string, Record<string, LockType>> = {
	analyse_besoins: { verification_infos: 'soft' },
	programme_modules: { verification_infos: 'soft' },
	devis: { programme_modules: 'hard' },
	convention: { devis: 'hard' },
	demande_financement: { convention: 'hard' },
	accord_opco: { demande_financement: 'hard' },
	session_edof: { convention: 'hard' },
	convocations: { convention: 'soft' },
	reglement_interieur: { convocations: 'soft' },
	test_positionnement: { analyse_besoins: 'soft' },
	preparation_logistique: { convention: 'soft' },
	affectation_formateur: { programme_modules: 'soft' },
	ordre_mission: { convention: 'soft' },
	accueil_lancement: {
		programme_modules: 'hard',
		convention: 'hard',
		preparation_logistique: 'hard',
		verification_infos: 'soft',
		convocations: 'soft',
		documents_formateur: 'soft'
	},
	emargement: { accueil_lancement: 'hard' },
	animation_pedagogique: { accueil_lancement: 'hard' },
	evaluations_formatives: { animation_pedagogique: 'hard' },
	suivi_absences: { emargement: 'hard' },
	adaptation_formation: { evaluations_formatives: 'hard' },
	satisfaction_chaud: { emargement: 'soft' },
	evaluation_acquis_fin: { evaluations_formatives: 'soft' },
	certificat_realisation: { emargement: 'hard' },
	attestation: { evaluation_acquis_fin: 'hard', certificat_realisation: 'soft' },
	facturation: { certificat_realisation: 'hard' },
	justificatifs_opco: { facturation: 'hard' },
	satisfaction_froid: { satisfaction_chaud: 'soft' },
	evaluation_transfert: { satisfaction_froid: 'soft' },
	bilan_formateur: { satisfaction_chaud: 'soft' },
	amelioration_continue: {
		satisfaction_chaud: 'hard',
		satisfaction_froid: 'soft',
		bilan_formateur: 'soft'
	},
	cloture_archivage: {
		satisfaction_chaud: 'hard',
		evaluation_acquis_fin: 'hard',
		certificat_realisation: 'hard',
		attestation: 'hard',
		facturation: 'hard',
		bilan_formateur: 'hard',
		amelioration_continue: 'hard'
	}
};

export function getDependencyLockType(questKey: string, depKey: string): LockType {
	return DEPENDENCY_LOCK_TYPES[questKey]?.[depKey] ?? 'hard';
}
