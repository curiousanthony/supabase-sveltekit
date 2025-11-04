<script lang="ts">
	import type { PageProps } from './$types';
	import {
		IconArchive,
		IconCirclePlus,
		IconDots,
		IconPaperclip,
		IconPhone,
		IconSearch,
		IconSend,
		IconVideo
	} from '@tabler/icons-svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	let { data }: PageProps = $props();
	// let { pageName } = $derived(data);

	type Conversation = {
		id: string;
		name: string;
		avatar: string;
		lastMessage: string;
		timestamp: string;
		unread: number;
		messages: Message[];
	};

	type Message = {
		id: string;
		text: string;
		timestamp: string;
		sender: 'me' | 'them';
	};

	let conversations: Conversation[] = $state([
		{
			id: '1',
			name: 'Alice',
			avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice',
			lastMessage: "Hey, how's it going?",
			timestamp: '10:40 AM',
			unread: 2,
			messages: [
				{ id: 'm1', text: "Hey, how's it going?", timestamp: '10:40 AM', sender: 'them' },
				{
					id: 'm2',
					text: 'Not bad, just working on a SvelteKit project. You?',
					timestamp: '10:41 AM',
					sender: 'me'
				},
				{ id: 'm3', text: 'Same here! Building a chat app.', timestamp: '10:42 AM', sender: 'them' }
			]
		},
		{
			id: '2',
			name: 'Bob',
			avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob',
			lastMessage: 'Can you send me the file?',
			timestamp: '9:30 AM',
			unread: 0,
			messages: [
				{ id: 'm4', text: 'Can you send me the file?', timestamp: '9:30 AM', sender: 'them' }
			]
		},
		{
			id: '3',
			name: 'Charlie',
			avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie',
			lastMessage: 'See you tomorrow!',
			timestamp: 'Yesterday',
			unread: 0,
			messages: [{ id: 'm5', text: 'See you tomorrow!', timestamp: 'Yesterday', sender: 'me' }]
		}
	]);

	let selectedConversation: Conversation | undefined = $state(conversations[0]);
	let messageInput = $state('');
	let chatContainer: HTMLDivElement;

	async function selectConversation(conversation: Conversation) {
		selectedConversation = conversation;
		// Wait for the DOM to update, then scroll to the bottom
		await tick();
		scrollToBottom();
	}

	function sendMessage() {
		if (messageInput.trim() === '' || !selectedConversation) return;

		const newMessage: Message = {
			id: `m${Date.now()}`,
			text: messageInput,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			sender: 'me'
		};

		selectedConversation.messages.push(newMessage);
		selectedConversation.lastMessage = newMessage.text;
		selectedConversation.timestamp = newMessage.timestamp;
		messageInput = '';
		scrollToBottom();
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}
</script>

<div class="h-[calc(100vh-8rem)] rounded-lg border bg-card text-card-foreground shadow-sm">
	<Resizable.PaneGroup direction="horizontal" class="h-full items-stretch">
		<Resizable.Pane defaultSize={30} minSize={20} class="flex flex-col">
			<div class="flex items-center p-4">
				<h1 class="text-xl font-bold">Messagerie</h1>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger asChild>
							<Button variant="ghost" size="icon" class="ml-auto">
								<IconCirclePlus class="size-5" />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Nouvelle conversation</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
			<Separator />
			<div class="p-4">
				<div class="relative">
					<IconSearch class="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
					<Input placeholder="Rechercher..." class="pl-8" />
				</div>
			</div>
			<div class="flex-1 overflow-auto">
				<div class="flex flex-col gap-1 p-2">
					{#each conversations as conversation (conversation.id)}
						<Button
							variant="ghost"
							class={cn(
								'flex h-auto items-start justify-start gap-3 p-3 text-left',
								selectedConversation?.id === conversation.id && 'bg-muted'
							)}
							onclick={() => selectConversation(conversation)}
						>
							<Avatar.Root class="flex items-center">
								<Avatar.Image src={conversation.avatar} alt={conversation.name} />
								<Avatar.Fallback>{conversation.name.charAt(0)}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex-1">
								<div class="flex items-center justify-between">
									<p class="font-semibold">{conversation.name}</p>
									<p class="text-xs text-muted-foreground">{conversation.timestamp}</p>
								</div>
								<p class="line-clamp-1 text-sm text-muted-foreground">
									{conversation.lastMessage}
								</p>
							</div>
							{#if conversation.unread > 0}
								<Badge
									class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
								>
									{conversation.unread}
								</Badge>
							{/if}
						</Button>
					{/each}
				</div>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={70}>
			{#if selectedConversation}
				<div class="flex h-full flex-col">
					<header class="flex items-center gap-4 border-b p-4">
						<Avatar.Root>
							<Avatar.Image src={selectedConversation.avatar} alt={selectedConversation.name} />
							<Avatar.Fallback>{selectedConversation.name.charAt(0)}</Avatar.Fallback>
						</Avatar.Root>
						<h2 class="text-lg font-semibold">{selectedConversation.name}</h2>
						<div class="ml-auto flex items-center gap-2">
							<Button variant="ghost" size="icon"><IconPhone class="size-5" /></Button>
							<Button variant="ghost" size="icon"><IconVideo class="size-5" /></Button>
							<Button variant="ghost" size="icon"><IconDots class="size-5" /></Button>
						</div>
					</header>
					<div bind:this={chatContainer} class="flex-1 overflow-auto p-4">
						<div class="flex flex-col gap-4">
							{#each selectedConversation.messages as message (message.id)}
								<div
									class={cn(
										'flex items-end gap-2',
										message.sender === 'me' ? 'justify-end' : 'justify-start'
									)}
								>
									{#if message.sender === 'them'}
										<Avatar.Root class="size-8">
											<Avatar.Image
												src={selectedConversation.avatar}
												alt={selectedConversation.name}
											/>
											<Avatar.Fallback>{selectedConversation.name.charAt(0)}</Avatar.Fallback>
										</Avatar.Root>
									{/if}
									<div
										class={cn(
											'max-w-xs rounded-lg p-3 text-sm',
											message.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'
										)}
									>
										<p>{message.text}</p>
										<p class="mt-1 text-right text-xs opacity-70">{message.timestamp}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
					<footer class="border-t p-4">
						<form onsubmit={sendMessage} class="relative flex items-center gap-2">
							<Button variant="ghost" size="icon" type="button"
								><IconPaperclip class="size-5" /></Button
							>
							<Input bind:value={messageInput} placeholder="Écrire un message..." class="flex-1" />
							<Button type="submit" size="icon" class="shrink-0">
								<IconSend class="size-5" />
							</Button>
						</form>
					</footer>
				</div>
			{:else}
				<div class="flex h-full flex-col items-center justify-center gap-2 text-center">
					<IconArchive class="size-12 text-muted-foreground" />
					<h3 class="text-xl font-semibold">Sélectionnez une conversation</h3>
					<p class="text-muted-foreground">
						Choisissez une conversation existante ou commencez-en une nouvelle.
					</p>
				</div>
			{/if}
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
