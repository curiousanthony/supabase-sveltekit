import { sitemap } from '$lib/settings/config';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  // const pageName = sitemap.find((item) => item.url === url.pathname)?.title ?? 'Default Page name';
  const pageName = sitemap.find((item) => url.pathname.includes(item.url))?.title ?? 'Default Page name';
  return { pageName };
};
