import type { Component } from 'svelte';
import logoPath from '$lib/assets/logo.svg';
import favicon from '$lib/assets/favicon.png';
import Search from '@lucide/svelte/icons/search';
import Home from '@lucide/svelte/icons/home';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Bell from '@lucide/svelte/icons/bell';
import MessageCircle from '@lucide/svelte/icons/message-circle';
import Calendar from '@lucide/svelte/icons/calendar';
import BookOpen from '@lucide/svelte/icons/book-open';
import Handshake from '@lucide/svelte/icons/handshake';
import Library from '@lucide/svelte/icons/library';
import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
import Wrench from '@lucide/svelte/icons/wrench';
import Users from '@lucide/svelte/icons/users';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';

/** Default tooltip for WIP nav items when no custom wipTooltip is set. */
export const defaultWipTooltip =
	'Cette fonctionnalité est en cours de développement et sera disponible dans une prochaine mise à jour.';

/**
 * Nav items hidden from the sidebar (e.g. for MVP when features are not ready).
 * - Use URL path to hide a sitemap/shortcut item (e.g. '/messagerie', '/qualiopi').
 * - Use 'credits' to hide the credits balance in the secondary nav.
 * Toggle via the Cursor command "Sidebar: hide/unhide nav items".
 */
export const sidebarHidden: (string | 'credits')[] = [
	'/messagerie',
	'/qualiopi',
	'/outils',
	'credits'
];

/** Permission required per nav URL. Undefined = visible to all. */
export const sitemapPermissions: Record<
	string,
	| 'deals'
	| 'clients'
	| 'formations'
	| 'qualiopi'
	| 'formateurs'
	| 'messagerie'
	| 'dashboard'
	| undefined
> = {
	'/': 'dashboard',
	'/messagerie': 'messagerie',
	'/formations': 'formations',
	'/contacts': 'formateurs',
	'/deals': 'deals',
	'/qualiopi': 'qualiopi'
};

export const appInfo = {
	name: 'Mentore Manager',
	desc: 'Mentore Manager',
	version: '1.0.0',
	logo: logoPath,
	favicon: favicon
};

export type SitemapItem = {
	title: string;
	url: string;
	icon: Component;
	wip?: boolean;
	disabled?: boolean;
	wipBadge?: string;
	wipTooltip?: string;
};

export const sitemap: SitemapItem[] = [
	{
		title: 'Notifications',
		url: '/inbox',
		icon: Bell,
		wip: true,
		disabled: true,
		wipTooltip:
			'Les notifications sont en cours de développement et seront disponibles dans une prochaine mise à jour.',
		wipBadge: 'Prochainement'
	},
	{
		title: 'Tableau de bord',
		url: '/',
		icon: LayoutDashboard
	},
	{
		title: 'Messagerie',
		url: '/messagerie',
		icon: MessageCircle
	},
	{
		title: 'Deals',
		url: '/deals',
		icon: Handshake
	},
	{
		title: 'Formations',
		url: '/formations',
		icon: GraduationCap,
		wip: true,
		disabled: false,
		wipTooltip: 'Les formations sont en cours de développement et sont partiellement disponibles.',
		wipBadge: 'Bêta'
	},
	{
		title: 'Calendrier',
		url: '/calendrier',
		icon: Calendar,
		wip: true,
		disabled: true,
		wipTooltip:
			'Le calendrier est en cours de développement et sera disponible dans une prochaine mise à jour.',
		wipBadge: 'Prochainement'
	},
	{
		title: 'CRM',
		url: '/contacts',
		icon: Users
	},
	{
		title: 'Gestion qualité',
		url: '/qualiopi',
		icon: ThumbsUp
	},
	{
		title: 'Bibliothèque',
		url: '/bibliotheque',
		icon: Library
	},
	{
		title: 'Outils',
		url: '/outils',
		icon: Wrench
	}
];

export default {
	appInfo,
	sitemap,
	sidebarHidden
};
