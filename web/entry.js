import { CLERK_PUBLISHABLE_KEY } from './auth-config.js';
import { setCurrentAccount } from './account.js';

const screen = document.querySelector('#auth-screen');
const choices = document.querySelector('#auth-choices');
const panel = document.querySelector('#auth-panel');
const provider = document.querySelector('#auth-provider');
const message = document.querySelector('#auth-message');
const title = document.querySelector('#auth-panel-title');
const login = document.querySelector('#auth-login');
const signup = document.querySelector('#auth-signup');
const back = document.querySelector('#auth-back');
let clerk = null;
let mounted = null;
let gameLoaded = false;
let requestedKind = null;

function frontendDomain(key) {
  const encoded = key.match(/^pk_(?:test|live)_(.+)$/)?.[1];
  if (!encoded) throw new Error('Invalid Clerk publishable key.');
  const domain = atob(encoded).replace(/\$$/, '');
  if (!/^[a-z0-9.-]+$/i.test(domain) || !domain.includes('.')) throw new Error('Invalid Clerk frontend domain.');
  return domain;
}

function loadScript(src, publishableKey = null) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    if (publishableKey) script.dataset.clerkPublishableKey = publishableKey;
    script.onload = resolve;
    script.onerror = () => reject(new Error('The login service could not be loaded.'));
    document.head.append(script);
  });
}

function unmount() {
  if (mounted === 'login') clerk?.unmountSignIn(provider);
  if (mounted === 'signup') clerk?.unmountSignUp(provider);
  mounted = null;
  provider.replaceChildren();
}

function showChoices() {
  unmount();
  requestedKind = null;
  panel.hidden = true;
  choices.hidden = false;
  message.textContent = '';
  login.focus();
}

function showForm(kind) {
  unmount();
  requestedKind = kind;
  choices.hidden = true;
  panel.hidden = false;
  title.textContent = kind === 'login' ? 'Log In' : 'Sign Up';
  message.textContent = clerk ? 'Continue with your GitHub account.' : 'GitHub login is not connected yet. The team must add a Clerk publishable key.';
  if (clerk) {
    const options = {
      routing: 'hash',
      forceRedirectUrl: location.href.split('#')[0],
      appearance: { variables: { colorPrimary: '#9d7843', colorBackground: '#f4ead5', colorText: '#213039' } },
    };
    if (kind === 'login') clerk.mountSignIn(provider, options);
    else clerk.mountSignUp(provider, options);
    mounted = kind;
  }
  back.focus();
}

async function enterHome(user) {
  if (gameLoaded || !user?.id) return;
  gameLoaded = true;
  unmount();
  setCurrentAccount(user);
  screen.hidden = true;
  await import('./main.js?v=auth-screen-1');
}

async function connect() {
  if (!CLERK_PUBLISHABLE_KEY) return;
  try {
    const domain = frontendDomain(CLERK_PUBLISHABLE_KEY);
    await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, CLERK_PUBLISHABLE_KEY);
    clerk = window.Clerk;
    await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
    clerk.addListener(({ user }) => {
      if (user) void enterHome(user);
    });
    if (clerk.user) await enterHome(clerk.user);
    else if (requestedKind) showForm(requestedKind);
  } catch (error) {
    clerk = null;
    message.textContent = 'Login is temporarily unavailable. Please reload the page.';
    console.error('Museum Mystery login:', error);
  }
}

login.addEventListener('click', () => showForm('login'));
signup.addEventListener('click', () => showForm('signup'));
back.addEventListener('click', showChoices);
document.querySelector('#home-signout').addEventListener('click', async () => {
  if (!clerk) return;
  await clerk.signOut();
  location.reload();
});
void connect();
