import { useState } from "react";
import { Quiz } from "../components/quizes";



export default function QuizScreen(){
    const [questionIndex, setQuestionIndex] = useState(0);
    const [isPressed, setIsPressed] = useState(false);

    const handleButtonClick = (indx: number) => {
        if (indx === quiz.answerIndexes[questionIndex] && !isPressed){
            setQuestionIndex((n) => n+1);
            console.log(questionIndex)
        }
        setIsPressed(true);
        
        // Optional: reset the state after a short delay if you only want 
        // to show a temporary effect
        setTimeout(() => {
        setIsPressed(false);
        }, 10); 
    };

    const [quiz] = useState(() => {
        const q = new Quiz();
        q.addQuizElm(["yes", "no", "maybe soooo"], "Is Aiden cool?", 0);
        q.addQuizElm(["yes", "no", "maybe soooo", ""], "Is Aiden bad?", 1);
        return q;
    });

    //const addQuestion = (answers: string[], question: string, answerIndex: number) => {
    //    setQuiz(prev => {
    //        const next = prev.clone();
    //        next.addQuizElm(answers, question, answerIndex);
    //        return next;
    //    });
    //};

    const answers = quiz.answers[questionIndex] ?? [];
    const question = quiz.questions[questionIndex];

    return (
        <>
        <div id="quiz_holder">
            <div id="question">
                <a>{question ?? "Loading..."}</a>
            </div>
            <div id="answers" className="answers-grid">
                {(answers ?? []).filter(Boolean).map((ans, idx) => (
                    <button key={idx} onClick={() => handleButtonClick(idx)}>{ans}</button>
                ))}
            </div>
        </div>
        </>
    );
}