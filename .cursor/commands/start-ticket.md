Boucle Agile complète pour démarrer un ticket. L'utilisateur doit fournir un identifiant ou nom de ticket (ex. "TCK-17" ou "Créer les entités CRM").

Étapes à suivre dans l'ordre :

1. **Fetch le ticket** (skill `suivi-de-projet`) : affiche le titre, statut, priorité, projet, effort estimé, sous-tâches éventuelles.

2. **Cherche la page prototype** (skill `mentore-manager-notion`, section "Implémenter un ticket") : recherche dans Prototype Mentore Manager la page correspondant à la fonctionnalité du ticket. Affiche les specs trouvées (UI, bases de données, propriétés, relations).

3. **Crée la branche Git** (skill `git-workflow`) : branche `feat/TCK-XX-slug` depuis `develop`.

4. **Passe le ticket à `⏳ En cours`** (skill `suivi-de-projet`, Workflow 4) après confirmation de l'utilisateur.

5. **Implémente** la fonctionnalité en suivant fidèlement le prototype (svelte5-stack + supabase-database-migration).

6. Une fois implémenté et validé : **passe le ticket à `✅ Fait`** dans Notion, et propose un commit Conventional Commit.

Réponse en français. Ne jamais modifier Notion sans confirmation explicite.
