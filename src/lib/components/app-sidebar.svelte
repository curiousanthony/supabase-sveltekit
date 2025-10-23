<script lang="ts">
	import CameraIcon from '@tabler/icons-svelte/icons/camera';
	import ChartBarIcon from '@tabler/icons-svelte/icons/chart-bar';
	import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
	import DatabaseIcon from '@tabler/icons-svelte/icons/database';
	import FileAiIcon from '@tabler/icons-svelte/icons/file-ai';
	import FileDescriptionIcon from '@tabler/icons-svelte/icons/file-description';
	import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
	import FolderIcon from '@tabler/icons-svelte/icons/folder';
	import HelpIcon from '@tabler/icons-svelte/icons/help';
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import ListDetailsIcon from '@tabler/icons-svelte/icons/list-details';
	import ReportIcon from '@tabler/icons-svelte/icons/report';
	import SearchIcon from '@tabler/icons-svelte/icons/search';
	import SettingsIcon from '@tabler/icons-svelte/icons/settings';
	import UsersIcon from '@tabler/icons-svelte/icons/users';
	import LayoutDashboard from '@tabler/icons-svelte/icons/layout-dashboard';
	import NavDocuments from './nav-documents.svelte';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	// import { appInfo } from '$lib/settings/config';

	import { page } from '$app/state';
	import Logo from './ui/custom/brand/logo.svelte';
	import Inbox from '@tabler/icons-svelte/icons/inbox';
	import Messages from '@tabler/icons-svelte/icons/messages';
	import CalendarWeek from '@tabler/icons-svelte/icons/calendar-week';
	// import School from '@tabler/icons-svelte/icons/school';
	import Books from '@tabler/icons-svelte/icons/books';
	import Book_2 from '@tabler/icons-svelte/icons/book-2';
	import HeartHandshake from '@tabler/icons-svelte/icons/heart-handshake';
	import ThumbUp from '@tabler/icons-svelte/icons/thumb-up';
	import Tool from '@tabler/icons-svelte/icons/tool';
	import History from '@tabler/icons-svelte/icons/history';
	import AddressBook from '@tabler/icons-svelte/icons/address-book';

	import { sitemap } from '$lib/settings/config';

	const data = {
		user: {
			name: 'Anthony Russo',
			email: 'anthony@mentore.fr'
			// avatar: '/avatars/shadcn.jpg'
		},
		navMain: [
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
				icon: AddressBook
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
		],
		navClouds: [
			{
				title: 'Capture',
				icon: CameraIcon,
				isActive: true,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Proposal',
				icon: FileDescriptionIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			},
			{
				title: 'Prompts',
				icon: FileAiIcon,
				url: '#',
				items: [
					{
						title: 'Active Proposals',
						url: '#'
					},
					{
						title: 'Archived',
						url: '#'
					}
				]
			}
		],
		navSecondary: [
			// {
			// 	title: 'Settings',
			// 	url: '#',
			// 	icon: SettingsIcon
			// },
			{
				title: "Demander de l'aide",
				url: 'mailto:support@mentore.fr',
				icon: HelpIcon
			}
			// {
			// 	title: 'Search',
			// 	url: '#',
			// 	icon: SearchIcon
			// }
		],
		documents: [
			{
				name: 'Data Library',
				url: '#',
				icon: DatabaseIcon
			},
			{
				name: 'Reports',
				url: '#',
				icon: ReportIcon
			},
			{
				name: 'Word Assistant',
				url: '#',
				icon: FileWordIcon
			}
		]
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Logo />
				<!-- <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5!"> -->
				<!-- {#snippet child({ props })}
						<a href="/" {...props} class="flex flex-col items-start">
							<img src={appInfo.logo} alt={appInfo.name} class="h-6" />
							<span class="text-xl font-bold text-[#EE2B47]">Manager</span>
						</a>
					{/snippet} -->
				<!-- </Sidebar.MenuButton> -->
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={sitemap} />
		<!-- <NavMain items={data.navMain} /> -->
		<!-- <NavDocuments items={data.documents} /> -->
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
