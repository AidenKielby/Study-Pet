import { useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from "firebase/auth";
import { db, auth } from "../firebase";

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
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setMessage(null);
		if (mode === "signup" && password !== confirm) {
			setMessage("Passwords do not match.");
			return;
		}
		setLoading(true);
		try {
			if (mode === "signup") {
				const cred = await createUserWithEmailAndPassword(auth, email, password);
				await setDoc(doc(db, "users", cred.user.uid), {
					email,
					pet: { stage: "Baby", evolutions: 0 }
				}, { merge: true });
				setMessage("Account created and signed in.");
			} else {
				await signInWithEmailAndPassword(auth, email, password);
				setMessage("Logged in.");
			}
		} catch (err: any) {
			setMessage(err?.message ?? "Authentication failed.");
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
						<h2>{mode === "login" ? "Log in" : "Sign up"}</h2>
						<p className="muted">Access your study pet and quizzes.</p>
					</div>
					<Link className="button-link ghost" to="/">Home</Link>
				</div>

				<div className="tab-row">
					<button
						type="button"
						className={`tab ${mode === "login" ? "active" : ""}`}
						onClick={() => setMode("login")}
					>
						Log in
					</button>
					<button
						type="button"
						className={`tab ${mode === "signup" ? "active" : ""}`}
						onClick={() => setMode("signup")}
					>
						Sign up
					</button>
				</div>

				<form className="auth-form" onSubmit={onSubmit}>
					<label>Email</label>
					<input
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						placeholder="you@example.com"
						required
					/>

					<label>Password</label>
					<input
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						placeholder="••••••••"
						required
					/>

					{mode === "signup" && (
						<>
							<label>Confirm password</label>
							<input
								type="password"
								value={confirm}
								onChange={e => setConfirm(e.target.value)}
								placeholder="Repeat password"
								required
							/>
						</>
					)}

					{message && <div className="feedback error">{message}</div>}

					<div className="actions spaced">
						<button type="submit" className="primary button-link full">
							{mode === "login" ? "Log in" : "Create account"}
						</button>
						<Link className="button-link secondary" to="/make">Make a quiz</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
