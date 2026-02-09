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

export const sitemap = [
	{
		title: 'Notifications',
		url: '/inbox',
		icon: Bell
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
		title: 'Formations',
		url: '/formations',
		icon: GraduationCap
	},
	{
		title: 'Calendrier',
		url: '/calendrier',
		icon: Calendar
	},
	{
		title: 'Contacts',
		url: '/contacts',
		icon: Users
	},
	{
		title: 'Deals',
		url: '/deals',
		icon: Handshake
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
	sitemap
};
