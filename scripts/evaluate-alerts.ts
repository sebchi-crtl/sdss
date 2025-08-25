// Run alerts evaluator via API (useful for local testing)
(async () => {
  const res = await fetch("http://localhost:3000/api/cron/evaluate", { method: "POST" });
  console.log(await res.json());
})();
