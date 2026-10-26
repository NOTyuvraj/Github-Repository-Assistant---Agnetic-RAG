import json
import statistics
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
RESULTS_PATH = BASE_DIR / "eval-results.json"

with open(RESULTS_PATH, "r", encoding="utf-8") as f:
    results = json.load(f)

latencies = [
    results["latencySeconds"]
    for result in results
    if result.get("requestSucceeded")
    and isinstance(result.get("latencySeconds"), (int, float))
]

if not latencies:
    raise ValueError("No valid latency measurements found.")

latencies.sort()


def percentile(values, p):
    index = (len(values) - 1) * p / 100
    lower = int(index)
    upper = min(lower + 1, len(values) - 1)
    fraction = index - lower
    return values[lower] + (values[upper] - values[lower]) * fraction


print(f"Requests measured: {len(latencies)}")
print(f"Mean latency: {statistics.mean(latencies):.2f}s")
print(f"Median latency: {statistics.median(latencies):.2f}s")
print(f"P95 latency: {percentile(latencies, 95):.2f}s")
print(f"Minimum latency: {min(latencies):.2f}s")
print(f"Maximum latency: {max(latencies):.2f}s")
