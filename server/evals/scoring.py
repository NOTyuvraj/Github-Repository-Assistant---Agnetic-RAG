import json
import os
from pathlib import Path
import random
import time
from dotenv import load_dotenv
from groq import Groq
from groq import RateLimitError

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

BASE_DIR = Path(__file__).resolve().parent

RESULTS_PATH = BASE_DIR / "eval-results.json"
DATASET_PATH = BASE_DIR / "gdDataset.jsonl"
OUTPUT_PATH = BASE_DIR / "scored-results.json"

JUDGE_MODEL = "openai/gpt-oss-20b"


def call_judge_with_retry(**kwargs):
    max_attempts = 6

    for attempt in range(max_attempts):
        try:
            return client.chat.completions.create(**kwargs)
        except RateLimitError:
            if attempt == max_attempts - 1:
                raise

            wait_seconds = min(15, 2**attempt) + random.random()
            print(f"Rate limited. Retrying in {wait_seconds:.1f}s...")
            time.sleep(wait_seconds)


def judge_answer(
    question: str,
    expected_points: list[str],
    actual_answer: str,
) -> dict:
    if not expected_points:
        return {
            "point_scores": [],
            "coverage": None,
            "reason": "No expected answer points to evaluate.",
        }
    prompt = f"""
        You are an impartial evaluator for a code repository RAG system.
        
        Evaluate the actual answer against each unexpected answer point.
        
        Rules: 
        - Score 2 if the point is correctly and sufficiently covered.
        - Score 1 if the point is only partially covered.
        - Score 0 if the point is missing, incorrect, or unsupported.
        - Judge semantic meaning, not exact wording.
        - Do not award points for claims that merely sound plausible.
        - Evaluate every expected point independently.
        - Return one score for each expected point, preserving its index.        
        
        Question :
        {question}
        
        Expected Answer Point:
        {json.dumps(expected_points, ensure_ascii=False)}
        
        Actual Answer:
        {actual_answer}
    """
    res = call_judge_with_retry(
        model=JUDGE_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful evalutaion judgeReturn only valid JSON."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "answer_evaluation",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "point_scores": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "index": {"type": "integer"},
                                    "score": {
                                        "type": "number",
                                        "enum": [0, 1, 2],
                                    },
                                    "reason": {"type": "string"},
                                },
                                "required": ["index", "score", "reason"],
                                "additionalProperties": False,
                            },
                        }
                    },
                    "required": ["point_scores"],
                    "additionalProperties": False,
                },
            },
        },
        temperature=0,
    )

    result = json.loads(res.choices[0].message.content)

    scores_by_index = {item["index"]: item["score"] for item in result["point_scores"]}

    expected_indices = set(range(len(expected_points)))

    if set(scores_by_index) != expected_indices:
        raise ValueError("Judge returned missing or invalid point indices. ")

    if any(score not in [0, 1, 2] for score in scores_by_index.values()):
        raise ValueError("Judge returned an invalid score.")

    scores_by_index = {index: score / 2 for index, score in scores_by_index.items()}

    ordered_scores = [scores_by_index[index] for index in range(len(expected_points))]

    return {
        "point_scores": result["point_scores"],
        "coverage": cal_coverage(ordered_scores),
    }


def cal_coverage(pt_scores: list[float]) -> float:
    if not pt_scores:
        return 0.0
    if any(score < 0 or score > 1 for score in pt_scores):
        raise ValueError("Each point score must be b/w 0 and 1.")

    return sum(pt_scores) / len(pt_scores)


def main():
    with RESULTS_PATH.open("r", encoding="utf-8") as file:
        results = json.load(file)

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        dataset = [json.loads(line) for line in file if line.strip()]

    dataset_by_id = {case["id"]: case for case in dataset}
    scored_results = []

    for index, result in enumerate(results, start=1):
        case_id = result["id"]

        if not result.get("requestSucceeded", False):
            print(f"[{index}/{len(results)}] {case_id}: SKIPPED")
            continue

        case = dataset_by_id[case_id]

        try:
            judgment = judge_answer(
                question=case["question"],
                expected_points=case.get("expectedAnswerPoints", []),
                actual_answer=str(result["actualAnswer"]),
            )

            scored_results.append(
                {
                    "id": case_id,
                    "question": case["question"],
                    "coverage": judgment["coverage"],
                    "point_scores": judgment["point_scores"],
                    "latencySeconds": result.get("latencySeconds"),
                }
            )

            coverage = judgment["coverage"]

            if coverage is None:
                print(f"[{index}/{len(results)}] {case_id}: N/A")
            else:
                print(f"[{index}/{len(results)}] {case_id}: coverage={coverage:.2f}")

        except Exception as error:
            print(f"[{index}/{len(results)}] {case_id}: ERROR - {error}")

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(scored_results, file, indent=2, ensure_ascii=False)

    valid_scores = [
        item["coverage"] for item in scored_results if item["coverage"] is not None
    ]

    if valid_scores:
        print(f"\nAverage answer coverage: {sum(valid_scores) / len(valid_scores):.3f}")

    print(f"Saved {len(scored_results)} scored results to {OUTPUT_PATH}")


print(f"Scored result saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
