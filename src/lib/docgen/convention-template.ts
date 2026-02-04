/**
 * Qualiopi-style "Convention de formation" template.
 * Placeholders use {variable_name} and are replaced with FormationDocData.
 */
export const CONVENTION_TEMPLATE = `
CONVENTION DE FORMATION PROFESSIONNELLE

Entre les soussignés :

L’organisme de formation :
Raison sociale : {organisme_legal_name}
SIRET : {organisme_siret}
Adresse : {organisme_address}

Ci-après dénommé « l’Organisme »,

Et le client :
{client_name}
Adresse : {client_address}
SIRET : {client_siret}
E-mail : {client_email}

Ci-après dénommé « le Bénéficiaire »,

Il a été convenu ce qui suit :

Article 1 – Objet
La présente convention a pour objet de définir les conditions dans lesquelles l’Organisme dispensera au Bénéficiaire la formation intitulée :

« {formation_title} »

Article 2 – Caractéristiques de la formation
- Durée : {formation_duration}
- Modalité : {formation_modality}
- Code RNCP (le cas échéant) : {formation_code_rncp}
- Type de financement : {formation_financement}

Article 3 – Lieu et date
Fait à {lieu}, le {date_signature}.

Pour l’Organisme ({organisme_name})          Pour le Bénéficiaire
_________________________                    _________________________
`.trim();

export const CONVENTION_PLACEHOLDERS = [
	'formation_title',
	'formation_duration',
	'formation_modality',
	'formation_code_rncp',
	'formation_financement',
	'client_name',
	'client_address',
	'client_siret',
	'client_email',
	'organisme_name',
	'organisme_legal_name',
	'organisme_siret',
	'organisme_address',
	'date_signature',
	'lieu'
] as const;
