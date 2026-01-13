

// let questions: string[] = ["what is 1+1?"];
// let answers: string[][] = [["1", "0", "4", "2"]];

export class Quiz {
    questions: string[];
    answers: string[][];
    answerIndexes: number[];

    constructor(
        questions: string[] = [],
        answers: string[][] = [],
        answerIndexes: number[] = []

    ) {
        this.questions = questions;
        this.answers = answers;
        this.answerIndexes = answerIndexes;
    }

    addQuizElm(answers: string[], question: string, answerIndex: number){
        this.answers.push(answers);
        this.questions.push(question);
        this.answerIndexes.push(answerIndex);
    }

    getAnswers(){
        return this.answers;
    }

    getQuestions(){
        return this.questions;
    }

    clone(): Quiz {
        return new Quiz(
            [...this.questions],
            this.answers.map(a => [...a]),
            [...this.answerIndexes]
        );
    }
}