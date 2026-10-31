// Draws the public sentiment pie chart on the policy page. Needs Chart.js loaded first.
(function () {
  var el = document.getElementById("sentimentChart");
  if (!el || typeof Chart === "undefined") return;
  new Chart(el, {
    type: "pie",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [{
        data: [Number(el.dataset.positive), Number(el.dataset.negative), Number(el.dataset.neutral)],
        backgroundColor: ["#2e7d32", "#c62828", "#78818c"]
      }]
    },
    options: { plugins: { legend: { display: false } } }
  });
})();
