import { describe, it, expect } from 'vitest';
import { getDependencyLockType, DEPENDENCY_LOCK_TYPES } from './formation-quest-locks';

describe('DEPENDENCY_LOCK_TYPES', () => {
	it('contains entries for all dependency pairs from spec §2', () => {
		const expectedPairs = [
			['analyse_besoins', 'verification_infos', 'soft'],
			['programme_modules', 'verification_infos', 'soft'],
			['devis', 'programme_modules', 'hard'],
			['convention', 'devis', 'hard'],
			['demande_financement', 'convention', 'hard'],
			['accord_opco', 'demande_financement', 'hard'],
			['session_edof', 'convention', 'hard'],
			['convocations', 'convention', 'soft'],
			['reglement_interieur', 'convocations', 'soft'],
			['test_positionnement', 'analyse_besoins', 'soft'],
			['preparation_logistique', 'convention', 'soft'],
			['affectation_formateur', 'programme_modules', 'soft'],
			['ordre_mission', 'convention', 'soft'],
			['accueil_lancement', 'programme_modules', 'hard'],
			['accueil_lancement', 'convention', 'hard'],
			['accueil_lancement', 'preparation_logistique', 'hard'],
			['accueil_lancement', 'verification_infos', 'soft'],
			['accueil_lancement', 'convocations', 'soft'],
			['accueil_lancement', 'documents_formateur', 'soft'],
			['emargement', 'accueil_lancement', 'hard'],
			['animation_pedagogique', 'accueil_lancement', 'hard'],
			['evaluations_formatives', 'animation_pedagogique', 'hard'],
			['suivi_absences', 'emargement', 'hard'],
			['adaptation_formation', 'evaluations_formatives', 'hard'],
			['satisfaction_chaud', 'emargement', 'soft'],
			['evaluation_acquis_fin', 'evaluations_formatives', 'soft'],
			['certificat_realisation', 'emargement', 'hard'],
			['attestation', 'evaluation_acquis_fin', 'hard'],
			['attestation', 'certificat_realisation', 'soft'],
			['facturation', 'certificat_realisation', 'hard'],
			['justificatifs_opco', 'facturation', 'hard'],
			['satisfaction_froid', 'satisfaction_chaud', 'soft'],
			['evaluation_transfert', 'satisfaction_froid', 'soft'],
			['bilan_formateur', 'satisfaction_chaud', 'soft'],
			['amelioration_continue', 'satisfaction_chaud', 'hard'],
			['amelioration_continue', 'satisfaction_froid', 'soft'],
			['amelioration_continue', 'bilan_formateur', 'soft'],
			['cloture_archivage', 'satisfaction_chaud', 'hard'],
			['cloture_archivage', 'evaluation_acquis_fin', 'hard'],
			['cloture_archivage', 'certificat_realisation', 'hard'],
			['cloture_archivage', 'attestation', 'hard'],
			['cloture_archivage', 'facturation', 'hard'],
			['cloture_archivage', 'bilan_formateur', 'hard'],
			['cloture_archivage', 'amelioration_continue', 'hard']
		] as const;

		for (const [quest, dep, expectedType] of expectedPairs) {
			expect(
				DEPENDENCY_LOCK_TYPES[quest]?.[dep],
				`${quest} → ${dep} should be '${expectedType}'`
			).toBe(expectedType);
		}
	});
});

describe('getDependencyLockType', () => {
	it('returns the correct lock type for known pairs', () => {
		expect(getDependencyLockType('analyse_besoins', 'verification_infos')).toBe('soft');
		expect(getDependencyLockType('devis', 'programme_modules')).toBe('hard');
		expect(getDependencyLockType('convocations', 'convention')).toBe('soft');
	});

	it('defaults to hard for unknown dependency pairs', () => {
		expect(getDependencyLockType('unknown_quest', 'unknown_dep')).toBe('hard');
	});

	it('defaults to hard for known quest with unknown dep', () => {
		expect(getDependencyLockType('analyse_besoins', 'fake_dep')).toBe('hard');
	});
});
