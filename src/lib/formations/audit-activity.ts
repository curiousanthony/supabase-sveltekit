import type { Component } from 'svelte';
import Pencil from '@lucide/svelte/icons/pencil';
import Calendar from '@lucide/svelte/icons/calendar';
import Trash2 from '@lucide/svelte/icons/trash-2';
import UserPlus from '@lucide/svelte/icons/user-plus';
import UserMinus from '@lucide/svelte/icons/user-minus';
import BookOpen from '@lucide/svelte/icons/book-open';
import Receipt from '@lucide/svelte/icons/receipt';
import Wallet from '@lucide/svelte/icons/wallet';
import MessageSquare from '@lucide/svelte/icons/message-square';
import CheckCircle from '@lucide/svelte/icons/check-circle';
import Check from '@lucide/svelte/icons/check';
import ArrowRightCircle from '@lucide/svelte/icons/arrow-right-circle';
import Clock from '@lucide/svelte/icons/clock';

export type AuditLogUser = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	avatarUrl: string | null;
	email: string | null;
} | null;

export type AuditLogEntry = {
	id: string;
	actionType: string;
	entityType?: string | null;
	entityId?: string | null;
	fieldName?: string | null;
	oldValue?: string | null;
	newValue?: string | null;
	createdAt: string;
	user: AuditLogUser;
};

export function formatRelativeTimeFr(isoDate: string): string {
	const then = new Date(isoDate).getTime();
	const now = Date.now();
	const diffMs = Math.max(0, now - then);
	const sec = Math.floor(diffMs / 1000);
	const min = Math.floor(sec / 60);
	const h = Math.floor(min / 60);
	const d = Math.floor(h / 24);
	const mo = Math.floor(d / 30);

	if (min < 1) return 'à l’instant';
	if (min < 60) return `il y a ${min}min`;
	if (h < 24) return `il y a ${h}h`;
	if (d < 30) return `il y a ${d}j`;
	return `il y a ${mo} mois`;
}

export function getAuditEventDescription(event: AuditLogEntry): string {
	switch (event.actionType) {
		case 'field_update':
			return `a modifié ${event.fieldName ?? 'un champ'}`;
		case 'session_created':
			return `a créé une séance`;
		case 'session_updated':
			return `a modifié une séance`;
		case 'session_deleted':
			return `a supprimé une séance`;
		case 'learner_added':
			return `a ajouté un apprenant`;
		case 'learner_removed':
			return `a retiré un apprenant`;
		case 'formateur_added':
			return `a assigné un formateur`;
		case 'formateur_removed':
			return `a retiré un formateur`;
		case 'module_added':
			return `a ajouté un module`;
		case 'module_updated':
			return `a modifié un module`;
		case 'module_deleted':
			return `a supprimé un module`;
		case 'invoice_created':
			return `a créé une facture`;
		case 'invoice_updated':
			return `a mis à jour une facture`;
		case 'cost_updated':
			return `a modifié les coûts`;
		case 'comment_added':
			return `a ajouté une note`;
		case 'quest_completed':
			return `a terminé une quête`;
		case 'sub_action_toggled':
			return `a modifié une sous-action`;
		case 'status_changed':
			return `a changé le statut`;
		default:
			return `a effectué une action`;
	}
}

export function getAuditEventIcon(actionType: string): Component {
	switch (actionType) {
		case 'field_update':
			return Pencil;
		case 'session_created':
		case 'session_updated':
			return Calendar;
		case 'session_deleted':
			return Trash2;
		case 'learner_added':
		case 'formateur_added':
			return UserPlus;
		case 'learner_removed':
		case 'formateur_removed':
			return UserMinus;
		case 'module_added':
		case 'module_updated':
		case 'module_deleted':
			return BookOpen;
		case 'invoice_created':
		case 'invoice_updated':
			return Receipt;
		case 'cost_updated':
			return Wallet;
		case 'comment_added':
			return MessageSquare;
		case 'quest_completed':
			return CheckCircle;
		case 'sub_action_toggled':
			return Check;
		case 'status_changed':
			return ArrowRightCircle;
		default:
			return Clock;
	}
}
