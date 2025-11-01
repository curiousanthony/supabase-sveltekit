import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types"


export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies, url }) => {
  const { session } = await safeGetSession()

  // If the user is NOT authenticated, redirect them to the login page
      if (!session) {
          // Use a 303 redirect and pass the current URL as a query parameter
          // so the user can be returned here after successful login.
          throw redirect(303, `/auth/login?redirectTo=${url.pathname}`);
      }
  
      // If authenticated, the layout and pages can load and access the session data

      const header = {
        pageName: url.pathname.split("/").pop()?.charAt(0).toUpperCase() + url.pathname.split("/").pop()?.slice(1) || 'Tableau de bord',
        actions: [],
      }

  return {
    session,
    cookies: cookies.getAll(),
    header
  }
}