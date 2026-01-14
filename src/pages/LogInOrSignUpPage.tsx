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
						<p className="muted">Access your study pet and quizzes in one click.</p>
					</div>
					<Link className="button-link ghost" to="/">Home</Link>
				</div>

				<div className="auth-form">
					{currentUser && (
						<div className="feedback success">Already signed in as {currentUser.displayName ?? currentUser.email ?? currentUser.uid}.</div>
					)}
					<button
						type="button"
						className="primary button-link full"
						onClick={handleGoogleSignIn}
						disabled={loading}
					>
						{loading ? "Connecting..." : "Continue with Google"}
					</button>
					<Link className="button-link secondary" to="/make">Make a quiz</Link>
					{message && <div className={`feedback ${messageType === "error" ? "error" : "success"}`}>{message}</div>}
				</div>
			</div>
		</div>
	);
}
