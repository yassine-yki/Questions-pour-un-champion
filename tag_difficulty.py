"""
One-shot data migration: add a `difficulty` field (1=easy, 2=medium, 3=hard)
to every question in the static question banks.

Heuristic: within each subject, rank questions by a text-complexity proxy
(question length + correct-answer length + total option length) and split into
equal thirds. This guarantees all three tiers are populated so the solo
adaptive selector always has matching questions to choose from.
Idempotent: re-running recomputes the same tags.
"""
import json

FILES = [
    "questions.json",
    "flag_questions.json",
    "image_riddles.json",
    "picguess_questions.json",
]


def complexity(q):
    qt = q.get("q", "")
    opts = q.get("options", []) or []
    correct_idx = q.get("correct", 0)
    correct = opts[correct_idx] if isinstance(correct_idx, int) and 0 <= correct_idx < len(opts) else ""
    return len(qt) + len(str(correct)) + sum(len(str(o)) for o in opts)


def tag_list(questions):
    """Assign difficulty 1/2/3 to a list of question dicts, split into thirds."""
    items = [q for q in questions if isinstance(q, dict) and "options" in q]
    if not items:
        return 0
    order = sorted(range(len(items)), key=lambda i: complexity(items[i]))
    n = len(order)
    t1 = n // 3            # easy count
    t2 = t1 + (n - t1) // 2  # easy+medium boundary
    for rank, idx in enumerate(order):
        if rank < t1:
            items[idx]["difficulty"] = 1
        elif rank < t2:
            items[idx]["difficulty"] = 2
        else:
            items[idx]["difficulty"] = 3
    return len(items)


def main():
    for fname in FILES:
        try:
            with open(fname, "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"skip (missing): {fname}")
            continue

        tagged = 0
        # Structure: data[lang][subject] = [question, ...]
        for lang, subjects in data.items():
            if not isinstance(subjects, dict):
                continue
            for subject, questions in subjects.items():
                if isinstance(questions, list):
                    tagged += tag_list(questions)

        with open(fname, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"{fname}: tagged {tagged} questions")


if __name__ == "__main__":
    main()
