import logoPath from '$lib/assets/logo.svg'
import favicon from '$lib/assets/favicon.png'
import Inbox from '@tabler/icons-svelte/icons/inbox'
import LayoutDashboard from '@tabler/icons-svelte/icons/layout-dashboard'
import Messages from '@tabler/icons-svelte/icons/messages'
import CalendarWeek from '@tabler/icons-svelte/icons/calendar-week'
import Book_2 from '@tabler/icons-svelte/icons/book-2'
// import AddressBook from '@tabler/icons-svelte/icons/address-book'
import HeartHandshake from '@tabler/icons-svelte/icons/heart-handshake'
import Books from '@tabler/icons-svelte/icons/books'
import ThumbUp from '@tabler/icons-svelte/icons/thumb-up'
import Tool from '@tabler/icons-svelte/icons/tool'
import History from '@tabler/icons-svelte/icons/history'
import Users from '@tabler/icons-svelte/icons/users'

export const appInfo = {
	"name": "Mentore Manager",
	"desc": "Mentore Manager",
	"version": "1.0.0",
	"logo": logoPath,
	"favicon": favicon
}


export const sitemap = [
	{
		title: 'Boîte de réception',
		url: '/inbox',
		icon: Inbox
	},
	{
		title: 'Tableau de bord',
		url: '/',
		icon: LayoutDashboard
	},
	{
		title: 'Messagerie',
		url: '/messagerie',
		icon: Messages
	},
	{
		title: 'Calendrier',
		url: '/calendrier',
		icon: CalendarWeek
	},
	{
		title: 'Formations',
		url: '/formations',
		icon: Book_2
	},
	{
		title: 'Contacts',
		url: '/contacts',
		// icon: AddressBook,
		icon: Users
	},
	{
		title: 'Deals',
		url: '/deals',
		icon: HeartHandshake
	},
	{
		title: 'Bibliothèque',
		url: '/bibliotheque',
		icon: Books
	},
	{
		title: 'Gestion qualité',
		url: '/qualiopi',
		icon: ThumbUp
	},
	{
		title: 'Outils',
		url: '/outils',
		icon: Tool
	},
	{
		title: 'Historique',
		url: '/historique',
		icon: History
	}
]

export default {
	appInfo,
	sitemap
}