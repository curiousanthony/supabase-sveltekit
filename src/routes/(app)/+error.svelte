<script lang="ts">
	import { page } from '$app/state';
</script>

<h1>{page.status}: {page.error?.message}</h1>
<p>The page you are trying to access doesn't exist.</p>
<p>The route you tried to go to was: {page.url.pathname}</p>
<p>Try going back to the <a href="/">home page</a>.</p>
