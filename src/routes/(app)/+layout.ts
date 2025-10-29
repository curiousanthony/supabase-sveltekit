import { sitemap } from '$lib/settings/config';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  // const pageName = sitemap.find((item) => item.url === url.pathname)?.title ?? 'Default Page name';
  const pageName = [...sitemap]
    .sort((a, b) => b.url.length - a.url.length)
    .find((item) => url.pathname.startsWith(item.url))?.title ?? 'Default Page name';
  return { pageName };
};
