import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

API_URL = os.getenv("API_URL", "http://localhost:1010")
DATASET_PATH = BASE_DIR / "gdDataset.jsonl"
RESULTS_PATH = BASE_DIR / "eval-results.json"
SESSION_ID = os.getenv("RAG_SESSION_ID")


def load_dataset():
    cases = []

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue

            try:
                cases.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(
                    f"Invalid JSON on line {line_number}: {error}"
                ) from error

    return cases


def ask_rag(question):
    response = requests.post(
        f"{API_URL}/ask",
        json={
            "query": question,
            "sessionId": SESSION_ID,
        },
        timeout=180,
    )

    response.raise_for_status()

    try:
        return response.json()
    except ValueError:
        return response.text


def main():
    if not SESSION_ID:
        print("Error: Session ID is not set.")
        return

    dataset = load_dataset()

    # Load existing results so previous evaluations aren't lost.
    if RESULTS_PATH.exists():
        with RESULTS_PATH.open("r", encoding="utf-8") as file:
            results = json.load(file)
    else:
        results = []

    # Evaluate only questions 12–20.
    target_cases = dataset[11:20]

    # Skip questions that have already succeeded.
    completed_ids = {
        result["id"] for result in results if result.get("requestSucceeded") is True
    }

    remaining_cases = [case for case in target_cases if case["id"] not in completed_ids]

    print(f"Loaded {len(dataset)} evaluation questions.")
    print(f"Target questions: {len(target_cases)} (express-012 to express-020)")
    print(f"Already completed: {len(target_cases) - len(remaining_cases)}")
    print(f"Remaining: {len(remaining_cases)}\n")

    for index, case in enumerate(remaining_cases, start=12):
        case_id = case["id"]

        print(f"[{index}/20] Running {case_id}...")

        try:
            start_time = time.perf_counter()
            answer = ask_rag(case["question"])
            latency_seconds = time.perf_counter() - start_time

            new_result = {
                "id": case_id,
                "question": case["question"],
                "expectedAnswerPoints": case.get("expectedAnswerPoints", []),
                "expectedEvidence": case.get("expectedEvidence", []),
                "answerable": case["answerable"],
                "actualAnswer": answer,
                "requestSucceeded": True,
                "latencySeconds": round(latency_seconds, 2),
            }

            print(f"[{index}/20] {case_id}: OK ({latency_seconds:.2f}s)")

        except requests.RequestException as error:
            new_result = {
                "id": case_id,
                "question": case["question"],
                "expectedAnswerPoints": case.get("expectedAnswerPoints", []),
                "expectedEvidence": case.get("expectedEvidence", []),
                "answerable": case["answerable"],
                "requestSucceeded": False,
                "error": str(error),
            }

            print(f"[{index}/20] {case_id}: FAILED")
            print(f"    Error: {error}")

        # Replace any previous result for this question.
        results = [result for result in results if result.get("id") != case_id]
        results.append(new_result)

        # Save all results, including previous questions.
        with RESULTS_PATH.open("w", encoding="utf-8") as file:
            json.dump(results, file, indent=2, ensure_ascii=False)

    successful = sum(
        result.get("requestSucceeded", False)
        for result in results
        if result.get("id") in {case["id"] for case in target_cases}
    )

    print(f"\nQuestions 12–20 successful: {successful}/9")
    print(f"Total results in file: {len(results)}")
    print(f"Results saved to: {RESULTS_PATH.resolve()}")


if __name__ == "__main__":
    main()
