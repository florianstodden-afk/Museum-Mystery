let currentAccount = null;

export function setCurrentAccount(user) {
  const github = user?.externalAccounts?.find(account => account.provider?.includes('github'));
  currentAccount = user ? { id: user.id, username: github?.username ?? user.username ?? user.fullName ?? 'player' } : null;
}

export function getCurrentAccount() {
  return currentAccount;
}

export function accountStorageKey(base, account = currentAccount) {
  if (!account?.id) throw new Error('An account is required for saved game progress.');
  return `${base}:${account.id}`;
}

export function accountStorage(storage, account = currentAccount) {
  return {
    getItem(key) { return storage.getItem(accountStorageKey(key, account)); },
    setItem(key, value) { storage.setItem(accountStorageKey(key, account), value); },
    removeItem(key) { storage.removeItem(accountStorageKey(key, account)); },
  };
}
