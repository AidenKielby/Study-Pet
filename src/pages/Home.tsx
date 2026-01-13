import { useState } from "react";
import { Link } from "react-router-dom";
import Pet from "../components/pet";

export default function Home() {
    const [stage, setStage] = useState<"Baby" | "Teen" | "Adult">("Baby");
    const [evolutions, setEvolutions] = useState<number>(0);

    const nextStage = () => {
        if (stage === "Baby") setStage("Teen");
        else if (stage === "Teen") setStage("Adult");
        else if (stage === "Adult"){ setStage("Baby"); setEvolutions((n) => n + 1);}
    };
    return (
        <>
            <h1>Home</h1>
            <Link to="/quiz">Go to Quiz</Link>
            <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-3xl font-bold mb-6">Study Pet</h1>
            <Pet stage={stage} evolutions={evolutions} />
            <button
                onClick={nextStage}
                className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
                Study Session Complete
            </button>
            </div>
        </>
    );
}