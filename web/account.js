let currentAccount = null;

export function setCurrentAccount(user) {
  currentAccount = user ? { id: user.id, username: user.username } : null;
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
