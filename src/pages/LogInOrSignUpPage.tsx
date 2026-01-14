import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { db, auth, googleProvider } from "../firebase";

type PetStatus = { stage: "Baby" | "Teen" | "Adult"; evolutions: number };

export function onUser(callback: (u: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getUserData(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function savePetStatus(uid: string, pet: PetStatus) {
  const ref = doc(db, "users", uid);
  // merge keeps other user fields intact
  await setDoc(ref, { pet }, { merge: true });
}

export async function updatePetStatus(uid: string, partial: Partial<PetStatus>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { "pet.stage": partial.stage, "pet.evolutions": partial.evolutions });
}

export default function LogInOrSignUpPage() {
	const [message, setMessage] = useState<string | null>(null);
	const [messageType, setMessageType] = useState<"error" | "success" | null>(null);
	const [loading, setLoading] = useState(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, setCurrentUser);
		return unsub;
	}, []);

	const handleGoogleSignIn = async () => {
		setMessage(null);
		setMessageType(null);
		setLoading(true);
		try {
			const cred = await signInWithPopup(auth, googleProvider);
			const { user } = cred;
			await setDoc(doc(db, "users", user.uid), {
				email: user.email ?? null,
				displayName: user.displayName ?? null,
				photoURL: user.photoURL ?? null,
				pet: { stage: "Baby", evolutions: 0 }
			}, { merge: true });
			setMessage(`Signed in as ${user.displayName ?? user.email ?? "your account"}.`);
			setMessageType("success");
		} catch (err: any) {
			setMessage(err?.message ?? "Google sign-in failed.");
			setMessageType("error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card card">
				<div className="header-row">
					<div>
						<p className="eyebrow">Welcome</p>
						<h2>Sign in with Google</h2>
						<p className="muted">Fast, passwordless access to your study pet.</p>
					</div>
					<Link className="button-link ghost" to="/">Home</Link>
				</div>

				<div className="auth-form">
					{currentUser && (
						<div className="feedback success">Already signed in as {currentUser.displayName ?? currentUser.email ?? currentUser.uid}.</div>
					)}
					<button
						type="button"
						className="google-button full"
						onClick={handleGoogleSignIn}
						disabled={loading}
					>
						<span className="google-icon" aria-hidden="true">
							<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M17.64 9.2c0-.63-.06-1.25-.18-1.85H9v3.49h4.84c-.21 1.12-.85 2.07-1.8 2.7v2.24h2.9c1.7-1.57 2.7-3.89 2.7-6.58Z" fill="#4285F4"/>
								<path d="M9 18c2.43 0 4.47-.8 5.96-2.22l-2.9-2.24c-.8.54-1.82.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33C2.38 15.98 5.46 18 9 18Z" fill="#34A853"/>
								<path d="M3.95 10.68c-.18-.54-.28-1.12-.28-1.68s.1-1.14.28-1.68V4.99H.9A8.99 8.99 0 000 9c0 1.45.35 2.81.9 4.01l3.05-2.33Z" fill="#FBBC05"/>
								<path d="M9 3.58c1.32 0 2.51.45 3.44 1.34l2.58-2.58C13.45.94 11.42 0 9 0 5.46 0 2.38 2.02.9 4.99l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58Z" fill="#EA4335"/>
								<path d="M0 0h18v18H0V0Z" fill="none"/>
							</svg>
						</span>
						<span>{loading ? "Connecting..." : "Continue with Google"}</span>
					</button>
					<Link className="button-link secondary" to="/make">Make a quiz</Link>
					{message && <div className={`feedback ${messageType === "error" ? "error" : "success"}`}>{message}</div>}
				</div>
			</div>
		</div>
	);
}
