// js/helpers.chart.js

// ------------------------------------------------------------
// CHART HELPERS (Unified Pie Chart Renderer)
// ------------------------------------------------------------
window.Helpers = window.Helpers || {};
Helpers._charts = Helpers._charts || {};

/**
 * Generic Pie Chart Renderer
 *
 * @param {Object} config
 *   containerSelector: "#snapshotGeoChart"
 *   canvasId: "geoChartCanvas"
 *   title: "Market value by Asset Region"
 *   labels: [...]
 *   values: [...]
 *   colors: [...]
 */
window.Helpers.renderPieChart = function(config) {
  const {
    containerSelector,
    canvasId,
    title,
    labels,
    values,
    colors
  } = config;

  const container = Helpers.DOM.one(containerSelector);
  if (!container) return;

  container.innerHTML = `<canvas id="${canvasId}"></canvas>`;
  const ctx = Helpers.DOM.one(`#${canvasId}`);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          title: {
            display: true,
            text: title,
            font: { size: 18, weight: "bold" },
            padding: { top: 10, bottom: 20 }
          },
          position: "top",
          align: "center",
          labels: {
            filter: function (legendItem, chartData) { 
              const index = legendItem.index; 
              const value = chartData.datasets[0].data[index]; 
              return value !== 0;
            },
            generateLabels(chart) {
              const dataset = chart.data.datasets[0];
              const total = dataset.data.reduce((a, b) => a + b, 0);

              const items = chart.data.labels.map((label, i) => {
                const value = dataset.data[i];
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const formattedValue = Helpers.formatByCurrency(value, "CAD");

                return {
                  label,
                  value,
                  pct,
                  formattedValue,
                  color: dataset.backgroundColor[i],
                  index: i
                };
              });

              // Sort by descending value
              items.sort((a, b) => b.value - a.value);

              return items.map(item => ({
                text: `${item.label}: ${item.formattedValue} (${item.pct}%)`,
                fillStyle: item.color,
                strokeStyle: item.color,
                lineWidth: 2,
                hidden: false,
                index: item.index
              }));
            }
          }
        },

        tooltip: {
          callbacks: {
            label(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const value = context.raw;
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              const formattedValue = Helpers.formatByCurrency(value, "CAD");

              return `${context.label}: ${formattedValue} (${pct}%)`;
            }
          }
        }
      }
    }
  });
};


// ------------------------------------------------------------
// GENERIC BAR CHART HELPER (Chart.js)
// ------------------------------------------------------------
Helpers.renderBarChart = function ({ containerSelector, canvasId, title, labels, values, colors }) {

  // Recreate canvas (important!)
  const container = Helpers.DOM.one(containerSelector);
  if (container) {
    container.innerHTML = `<canvas id="${canvasId}"></canvas>`;
  }

  const canvas = Helpers.DOM.one(`#${canvasId}`);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Destroy existing chart if it exists
  if (Helpers._charts[canvasId]) {
    Helpers._charts[canvasId].destroy();
  }

  Helpers._charts[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          backgroundColor: colors || "#4e79a7"
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },
        title: { display: true, text: title },
        tooltip: {
          callbacks: {
            label: ctx => `${(ctx.parsed.x * 100).toFixed(3)}%`
          }
        }
      },

      scales: {
        y: {
          beginAtZero: true,
          ticks: { autoSkip: false }
        },
        x: {
          beginAtZero: true,
          ticks: {
            callback: v => `${(v * 100).toFixed(3)}%`
          }
        }
      }
    }
  });
};
