import type { InlineType } from './formation-quests';

/**
 * Determines whether a sub-action should auto-complete based on its inline type
 * and the event that just happened.
 */
export type CompletionEvent =
	| { type: 'field-saved'; fieldKey: string }
	| { type: 'file-uploaded'; fileName: string }
	| { type: 'document-generated'; documentType: string; documentId: string }
	| { type: 'email-sent'; emailType: string }
	| { type: 'external-received' }
	| { type: 'manual-confirm' };

/**
 * Maps inline types to their completion trigger.
 * Returns true if the given event should auto-complete a sub-action of the given inline type.
 */
export function shouldAutoComplete(
	inlineType: InlineType,
	event: CompletionEvent
): boolean {
	switch (inlineType) {
		case 'verify-fields':
			return event.type === 'field-saved';
		case 'upload-document':
			return event.type === 'file-uploaded';
		case 'generate-document':
			return event.type === 'document-generated';
		case 'send-email':
			return event.type === 'email-sent';
		case 'wait-external':
			return event.type === 'external-received';
		case 'confirm-task':
			return event.type === 'manual-confirm';
		case 'select-people':
			return event.type === 'manual-confirm';
		case 'external-link':
			return event.type === 'manual-confirm';
		case 'inline-view':
			return event.type === 'manual-confirm';
	}
}

/**
 * Checks if all sub-actions in a quest are completed.
 * Returns celebration metadata if the quest just completed.
 */
export function checkQuestCompletion(
	subActions: { completed: boolean }[]
): { allComplete: boolean; justCompleted: boolean; completedCount: number; totalCount: number } {
	const totalCount = subActions.length;
	const completedCount = subActions.filter((s) => s.completed).length;
	const allComplete = completedCount === totalCount && totalCount > 0;

	return {
		allComplete,
		justCompleted: allComplete,
		completedCount,
		totalCount
	};
}

/**
 * Returns a celebration message when a quest is completed.
 */
export function getCelebrationMessage(questTitle: string): string {
	const messages = [
		`"${questTitle}" terminé ! Bravo !`,
		`Excellent ! "${questTitle}" est complété.`,
		`"${questTitle}" : fait ! Vous avancez bien.`,
		`C'est validé ! "${questTitle}" est terminé.`
	];
	return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Returns the label for a sub-action's completion method based on its inline type.
 * Used to show the user how this task will complete.
 */
export function getCompletionHint(inlineType: InlineType): string | null {
	switch (inlineType) {
		case 'verify-fields':
			return 'Se complète automatiquement à la sauvegarde';
		case 'upload-document':
			return 'Se complète automatiquement au téléversement';
		case 'generate-document':
			return 'Se complète automatiquement à la génération';
		case 'send-email':
			return "Se complète automatiquement à l'envoi";
		case 'wait-external':
			return null;
		case 'confirm-task':
			return null;
		case 'select-people':
			return null;
		case 'external-link':
			return null;
		case 'inline-view':
			return null;
	}
}
