import type { Auth } from "firebase/auth";

export type Identity = {
  uid: string;
  name: string;
};

// Provides a stable identity for signed-in and anonymous users.
export function getIdentity(auth: Auth): Identity {
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      name: user.displayName ?? user.email ?? "User",
    };
  }

  let anonId = localStorage.getItem("anonUserId");
  let anonName = localStorage.getItem("anonUserName");

  if (!anonId) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    anonId = `anon-${rand}`;
    anonName = `User${rand}`;
    localStorage.setItem("anonUserId", anonId);
    localStorage.setItem("anonUserName", anonName);
  }

  if (!anonName) {
    anonName = "Unknown User";
    localStorage.setItem("anonUserName", anonName);
  }

  return { uid: anonId, name: anonName };
}
