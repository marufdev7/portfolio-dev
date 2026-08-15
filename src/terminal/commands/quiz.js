// ---------------------------------------------------------------
// The quiz (§6.7).
//
// A quiz round takes over the prompt: while one is running, every line
// you type is an answer, not a command. That's the engine's interceptor
// hook, and it's what makes `quiz` feel like a mode instead of a
// command that happens to print a question.
//
// Subnetting questions are GENERATED, so the answers are computed by
// the same lib/ip.js the rest of the site uses — a wrong answer key is
// impossible by construction.
// ---------------------------------------------------------------

import * as out from "../output";
import { quizModes, buildQuiz, checkAnswer } from "../../data/quizBank";

const MODES = Object.keys(quizModes);

/** Prints the current question and, on the last one, the scoreboard. */
function askQuestion(session) {
    const q = session.questions[session.index];
    return [
        out.blank(),
        out.heading(`Question ${session.index + 1} of ${session.questions.length}`),
        out.text(q.prompt),
        ...(q.hint ? [out.muted(`hint: ${q.hint}`)] : []),
        out.muted("answer, or `skip` · `quit` to stop"),
    ];
}

function scoreboard(session) {
    const total = session.questions.length;
    const pct = total ? Math.round((session.correct / total) * 100) : 0;

    const verdict =
        pct >= 90
            ? out.success("Solid. That's exam pace.")
            : pct >= 70
                ? out.success("Good — the gaps are narrow enough to close.")
                : pct >= 40
                    ? out.warn("Getting there. Run it again; the questions regenerate.")
                    : out.warn("Worth a re-read before the next round.");

    const blocks = [
        out.blank(),
        out.heading(`${session.correct}/${total} — ${pct}%`),
        verdict,
    ];

    if (session.missed.length) {
        blocks.push(
            out.blank(),
            out.heading("Worth reviewing"),
            ...session.missed.flatMap((m) => [
                out.text(`  ${m.prompt}`),
                out.success(`    → ${m.answer}`),
                ...(m.solution ? [out.muted(`    ${m.solution}`)] : []),
            ])
        );
    }

    blocks.push(out.blank(), out.muted("`quiz` to go again."));
    return blocks;
}

/** The interceptor: owns every line typed while a round is live. */
function makeInterceptor(session) {
    return (line, ctx) => {
        const input = line.trim();
        const q = session.questions[session.index];

        if (/^(quit|exit|q|stop)$/i.test(input)) {
            ctx.setInterceptor(null);
            ctx.session.quiz = null;
            return [out.muted("quiz ended early."), ...scoreboard(session)];
        }

        let feedback;

        if (/^(skip|s|\?)$/i.test(input)) {
            feedback = [
                out.warn(`skipped — the answer was ${q.answer}`),
                ...(q.solution ? [out.muted(q.solution)] : []),
            ];
            session.missed.push(q);
        } else if (checkAnswer(q, input)) {
            session.correct++;
            feedback = [out.success("correct"), ...(q.solution ? [out.muted(q.solution)] : [])];
        } else {
            feedback = [
                out.error(`not quite — the answer is ${q.answer}`),
                ...(q.solution ? [out.muted(q.solution)] : []),
            ];
            session.missed.push(q);
        }

        session.index++;

        if (session.index >= session.questions.length) {
            ctx.setInterceptor(null);
            ctx.session.quiz = null;
            return [...feedback, ...scoreboard(session)];
        }

        return [...feedback, ...askQuestion(session)];
    };
}

const quiz = {
    name: "quiz",
    aliases: ["test", "drill"],
    category: "quiz",
    usage: "quiz [subnet|vlan|ports|osi] [--count <n>]",
    description: "Drill yourself. Subnetting questions are generated fresh each round.",
    examples: ["quiz", "quiz subnet --count 5", "quiz ports"],
    notes:
        "While a round is running the prompt belongs to the quiz: type answers, `skip` to pass, `quit` to stop early.",
    flags: { count: "number" },
    aliasFlags: { n: "count" },
    complete: () => MODES,

    run(ctx, { args, flags }) {
        if (ctx.session.quiz) {
            return out.warn("a quiz is already running — answer it, or type `quit`.");
        }

        const mode = (args[0] ?? "subnet").toLowerCase();
        if (!MODES.includes(mode)) {
            return [
                out.error(`unknown quiz mode '${mode}'`),
                out.blank(),
                out.table(
                    ["mode", "topic"],
                    MODES.map((m) => [m, quizModes[m].label]),
                    { accent: "net" }
                ),
            ];
        }

        const count = Math.min(Math.max(Number(flags.count ?? 5), 1), 20);
        const questions = buildQuiz(mode, count);

        if (questions.length === 0) {
            return out.error(`no questions available for '${mode}'`);
        }

        const session = { mode, questions, index: 0, correct: 0, missed: [] };
        ctx.session.quiz = session;
        ctx.setInterceptor(makeInterceptor(session));

        return [
            out.heading(`${quizModes[mode].label} — ${questions.length} questions`),
            out.muted(
                quizModes[mode].generated
                    ? "Generated fresh, so the same round never repeats."
                    : "Drawn at random from the bank — no repeats within a round."
            ),
            ...askQuestion(session),
        ];
    },
};

export default [quiz];
