# Guide de Développement

Ce projet utilise **Supabase** pour la base de données et **Drizzle ORM** pour des interactions typées avec la base de données.

[🇺🇸 English Version](./database.md)

## Workflow Base de Données (DB-First)

Nous suivons un workflow "DB-First" (Base de données d'abord) où vous effectuez les modifications dans le Dashboard Supabase, puis vous les synchronisez avec votre code.

### 1. Modifier la Base de Données
Effectuez vos changements de schéma (création de tables, ajout de colonnes, etc.) directement dans votre Dashboard Supabase **local**.
- URL : `http://127.0.0.1:54323` (par défaut)

### 2. Synchroniser le Code (`db:pull`)
Récupérez les changements de votre base de données locale vers votre fichier de schéma Drizzle.

```bash
npm run db:pull
```
> **Ce que cela fait :** Introspecte votre base de données locale et met à jour `src/lib/db/schema.ts` pour qu'il corresponde.

### 3. Générer la Migration (`db:generate`)
Créez un nouveau fichier de migration SQL basé sur les changements dans votre fichier de schéma.

```bash
npm run db:generate
```
> **Ce que cela fait :** Compare votre nouveau `schema.ts` avec le dernier snapshot de migration et génère un fichier `.sql` horodaté dans `supabase/migrations/`.

### 4. Déployer (`supabase db push`)
Appliquez la nouvelle migration à votre projet Supabase **distant** lié (Production/Staging).

```bash
supabase db push
```
> **Ce que cela fait :** Applique les migrations en attente sur la base de données distante et met à jour la table d'historique `supabase_migrations`.

---

## Notes Importantes

### 🚫 NE PAS utiliser `db:push` ou `db:migrate`
Nous avons désactivé `npm run db:push` et `npm run db:migrate`.
- **Raison :** Ces commandes contournent le suivi de l'historique des migrations de Supabase, ce qui entraîne des conflits "relation already exists" lorsque vous essayez de déployer plus tard.
- **Toujours** utiliser le workflow ci-dessus pour garantir que Drizzle et Supabase restent synchronisés.

### Dépannage
Si vous rencontrez des erreurs **"relation already exists"** lors du `supabase db push` :
1.  Cela signifie généralement que la migration a déjà été appliquée (peut-être manuellement ou via l'interface utilisateur) mais que Supabase ne le sait pas.
2.  Utilisez `supabase migration repair` pour marquer la migration conflictuelle comme "appliquée".
