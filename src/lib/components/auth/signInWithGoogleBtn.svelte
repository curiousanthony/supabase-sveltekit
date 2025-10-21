<!--<script>
  import { supabase } from '$lib/supabaseClient'; // Adjust path to your client

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
    }
  }
</script>

<button on:click={signInWithGoogle} class="google-btn">
  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 9.196C34.996 5.66 29.803 3.5 24 3.5C13.255 3.5 4.5 12.255 4.5 23.5S13.255 43.5 24 43.5s19.5-8.745 19.5-19.5c0-1.396-.138-2.756-.389-4.083z"/>
  </svg>
  <span>Sign in with Google</span>
</button>

<style>
  .google-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 12px;
    height: 40px;
    background-color: #ffffff;
    color: #333333;
    border: 1px solid #dcdcdc;
    border-radius: 4px;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
  }
  .google-btn:hover {
    background-color: #f5f5f5;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1);
  }
</style>-->
