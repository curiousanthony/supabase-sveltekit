<script>
	import { appInfo } from '$lib/settings/config';

	// const { className: string, direction, ...restProps } = $props();
	let { className = '', ...restProps } = $props();
</script>

<a href="/" class={className + ' flex flex-col items-start'}>
	<!-- <InnerShadowTopIcon class="size-5!" /> -->
	<img src={appInfo.logo} alt={appInfo.name} class="h-6" />
	<span class="text-xl font-bold text-[#EE2B47]">Manager</span>
	<!-- <span class="text-base font-semibold">{appInfo.name}</span> -->
</a>
