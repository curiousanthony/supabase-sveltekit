<script lang="ts"></script>

<svelte:head>
	<title>Configuration de l'espace</title>
</svelte:head>

<div class="onboarding">
	<h1>Configuration de votre espace</h1>
	<p class="message">
		Nous n'avons pas pu créer votre espace de travail automatiquement. Cela peut arriver en cas de
		problème temporaire.
	</p>
	<p class="hint">Cliquez sur « Réessayer » pour relancer la création.</p>
	<div class="actions">
		<a href="/" class="button" data-sveltekit-preload-data="hover">Réessayer</a>
		<a href="/auth/logout" class="button secondary">Se déconnecter</a>
	</div>
</div>

<style>
	.onboarding {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
		text-align: center;
	}
	h1 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}
	.message {
		color: var(--muted-foreground, #64748b);
		max-width: 28rem;
		margin-bottom: 0.5rem;
	}
	.hint {
		font-size: 0.875rem;
		color: var(--muted-foreground, #64748b);
		margin-bottom: 1.5rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-decoration: none;
		background: var(--primary, #0f172a);
		color: var(--primary-foreground, #fff);
		border: none;
		cursor: pointer;
	}
	.button:hover {
		opacity: 0.9;
	}
	.button.secondary {
		background: transparent;
		color: var(--muted-foreground, #64748b);
		border: 1px solid var(--border, #e2e8f0);
	}
</style>
