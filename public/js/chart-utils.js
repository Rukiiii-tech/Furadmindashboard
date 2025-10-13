// chart-utils.js
// Simple chart utilities for the forecasting dashboard

/**
 * Creates a simple bar chart using HTML and CSS
 */
export function createBarChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    title = "Chart",
    xLabel = "X Axis",
    yLabel = "Y Axis",
    barColor = "#ffb64a",
    barHoverColor = "#e6a43f",
    height = 300,
    width = "100%",
  } = options;

  // Clear container
  container.innerHTML = "";

  // Create chart wrapper
  const chartWrapper = document.createElement("div");
  chartWrapper.style.cssText = `
    width: ${width};
    height: ${height}px;
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  // Create title
  const titleElement = document.createElement("h4");
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 20px 0;
    text-align: center;
    color: #333;
    font-size: 1.1em;
  `;

  // Create chart area
  const chartArea = document.createElement("div");
  chartArea.style.cssText = `
    position: relative;
    height: calc(100% - 80px);
    display: flex;
    align-items: end;
    justify-content: space-around;
    gap: 4px;
    padding: 20px 0;
    border-bottom: 2px solid #e9ecef;
    border-left: 2px solid #e9ecef;
  `;

  // Find max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  // Create bars
  data.forEach((item, index) => {
    const barContainer = document.createElement("div");
    barContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      height: 100%;
      position: relative;
    `;

    const bar = document.createElement("div");
    const barHeight =
      maxValue > 0
        ? ((item.value - minValue) / (maxValue - minValue)) * 100
        : 0;

    bar.style.cssText = `
      width: 100%;
      height: ${Math.max(barHeight, 5)}%;
      background: ${barColor};
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
      min-height: 20px;
    `;

    // Add hover effect
    bar.addEventListener("mouseenter", () => {
      bar.style.background = barHoverColor;
      bar.style.transform = "scale(1.05)";
    });

    bar.addEventListener("mouseleave", () => {
      bar.style.background = barColor;
      bar.style.transform = "scale(1)";
    });

    // Add value label
    const valueLabel = document.createElement("div");
    valueLabel.textContent = formatCurrency(item.value);
    valueLabel.style.cssText = `
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;

    bar.addEventListener("mouseenter", () => {
      valueLabel.style.opacity = "1";
    });

    bar.addEventListener("mouseleave", () => {
      valueLabel.style.opacity = "0";
    });

    // Add x-axis label
    const xLabelElement = document.createElement("div");
    xLabelElement.textContent = item.label;
    xLabelElement.style.cssText = `
      margin-top: 10px;
      font-size: 0.8em;
      color: #666;
      text-align: center;
      transform: rotate(-45deg);
      white-space: nowrap;
    `;

    barContainer.appendChild(bar);
    barContainer.appendChild(valueLabel);
    barContainer.appendChild(xLabelElement);
    chartArea.appendChild(barContainer);
  });

  // Add y-axis labels
  const yAxisLabels = document.createElement("div");
  yAxisLabels.style.cssText = `
    position: absolute;
    left: -40px;
    top: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.8em;
    color: #666;
  `;

  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const label = document.createElement("div");
    const value = minValue + (maxValue - minValue) * (i / steps);
    label.textContent = formatCurrency(value);
    label.style.cssText = `
      transform: translateY(-50%);
      margin-top: ${(i / steps) * 100}%;
    `;
    yAxisLabels.appendChild(label);
  }

  // Assemble chart
  chartWrapper.appendChild(titleElement);
  chartWrapper.appendChild(chartArea);
  chartWrapper.appendChild(yAxisLabels);
  container.appendChild(chartWrapper);
}

/**
 * Creates a line chart using HTML and CSS
 */
export function createLineChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    title = "Line Chart",
    xLabel = "X Axis",
    yLabel = "Y Axis",
    lineColor = "#ffb64a",
    pointColor = "#ffb64a",
    height = 300,
    width = "100%",
  } = options;

  // Clear container
  container.innerHTML = "";

  // Create chart wrapper
  const chartWrapper = document.createElement("div");
  chartWrapper.style.cssText = `
    width: ${width};
    height: ${height}px;
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  // Create title
  const titleElement = document.createElement("h4");
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 20px 0;
    text-align: center;
    color: #333;
    font-size: 1.1em;
  `;

  // Create SVG chart
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "calc(100% - 40px)");
  svg.style.cssText = `
    border-bottom: 2px solid #e9ecef;
    border-left: 2px solid #e9ecef;
  `;

  // Find max and min values
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  // Create line path
  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
      return `${x},${y}`;
    })
    .join(" ");

  // Create line
  const line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polyline"
  );
  line.setAttribute("points", points);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", lineColor);
  line.setAttribute("stroke-width", "3");
  line.style.cssText = `
    transition: all 0.3s ease;
  `;

  // Create points
  data.forEach((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x + "%");
    circle.setAttribute("cy", y + "%");
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", pointColor);
    circle.style.cssText = `
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    // Add hover effect
    circle.addEventListener("mouseenter", () => {
      circle.setAttribute("r", "6");
      circle.setAttribute("fill", "#e6a43f");
    });

    circle.addEventListener("mouseleave", () => {
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", pointColor);
    });

    svg.appendChild(circle);
  });

  // Add x-axis labels
  data.forEach((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", x + "%");
    label.setAttribute("y", "105%");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "12");
    label.setAttribute("fill", "#666");
    label.textContent = item.label;
    svg.appendChild(label);
  });

  // Add y-axis labels
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    const value = minValue + range * (1 - i / steps);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", "-5%");
    label.setAttribute("y", y + "%");
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("font-size", "12");
    label.setAttribute("fill", "#666");
    label.textContent = formatCurrency(value);
    svg.appendChild(label);
  }

  svg.appendChild(line);

  // Assemble chart
  chartWrapper.appendChild(titleElement);
  chartWrapper.appendChild(svg);
  container.appendChild(chartWrapper);
}

/**
 * Creates a pie chart using HTML and CSS
 */
export function createPieChart(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { title = "Pie Chart", height = 300, width = "100%" } = options;

  // Clear container
  container.innerHTML = "";

  // Create chart wrapper
  const chartWrapper = document.createElement("div");
  chartWrapper.style.cssText = `
    width: ${width};
    height: ${height}px;
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  // Create title
  const titleElement = document.createElement("h4");
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 20px 0;
    text-align: center;
    color: #333;
    font-size: 1.1em;
  `;

  // Create chart area
  const chartArea = document.createElement("div");
  chartArea.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(100% - 40px);
    gap: 40px;
  `;

  // Create pie chart
  const pieChart = document.createElement("div");
  pieChart.style.cssText = `
    width: 200px;
    height: 200px;
    border-radius: 50%;
    position: relative;
    background: conic-gradient(${data
      .map(
        (item, index) =>
          `${item.color} ${index === 0 ? 0 : data.slice(0, index).reduce((sum, d) => sum + d.percentage, 0)}% ${data.slice(0, index + 1).reduce((sum, d) => sum + d.percentage, 0)}%`
      )
      .join(", ")});
  `;

  // Create legend
  const legend = document.createElement("div");
  legend.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  data.forEach((item, index) => {
    const legendItem = document.createElement("div");
    legendItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9em;
    `;

    const colorBox = document.createElement("div");
    colorBox.style.cssText = `
      width: 16px;
      height: 16px;
      background: ${item.color};
      border-radius: 3px;
    `;

    const label = document.createElement("span");
    label.textContent = `${item.label}: ${item.percentage}%`;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legend.appendChild(legendItem);
  });

  // Assemble chart
  chartArea.appendChild(pieChart);
  chartArea.appendChild(legend);
  chartWrapper.appendChild(titleElement);
  chartWrapper.appendChild(chartArea);
  container.appendChild(chartWrapper);
}

/**
 * Formats currency values
 */
function formatCurrency(value) {
  if (typeof value !== "number") return "₱0.00";
  return `₱${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Creates a simple gauge chart
 */
export function createGaugeChart(containerId, value, maxValue, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const {
    title = "Gauge Chart",
    height = 200,
    width = "100%",
    color = "#ffb64a",
  } = options;

  // Clear container
  container.innerHTML = "";

  // Create chart wrapper
  const chartWrapper = document.createElement("div");
  chartWrapper.style.cssText = `
    width: ${width};
    height: ${height}px;
    position: relative;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: center;
  `;

  // Create title
  const titleElement = document.createElement("h4");
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.1em;
  `;

  // Create gauge
  const gauge = document.createElement("div");
  gauge.style.cssText = `
    width: 120px;
    height: 60px;
    border-radius: 120px 120px 0 0;
    background: conic-gradient(${color} 0deg ${(value / maxValue) * 180}deg, #e9ecef ${(value / maxValue) * 180}deg 180deg);
    margin: 0 auto 20px;
    position: relative;
  `;

  // Create gauge needle
  const needle = document.createElement("div");
  const rotation = (value / maxValue) * 180;
  needle.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 4px;
    height: 50px;
    background: #333;
    transform: translateX(-50%) rotate(${rotation}deg);
    transform-origin: bottom center;
    border-radius: 2px;
    transition: transform 0.5s ease;
  `;

  // Create value display
  const valueDisplay = document.createElement("div");
  valueDisplay.style.cssText = `
    font-size: 1.5em;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  `;
  valueDisplay.textContent = formatCurrency(value);

  // Create max value display
  const maxValueDisplay = document.createElement("div");
  maxValueDisplay.style.cssText = `
    font-size: 0.9em;
    color: #666;
  `;
  maxValueDisplay.textContent = `of ${formatCurrency(maxValue)}`;

  // Assemble gauge
  gauge.appendChild(needle);
  chartWrapper.appendChild(titleElement);
  chartWrapper.appendChild(gauge);
  chartWrapper.appendChild(valueDisplay);
  chartWrapper.appendChild(maxValueDisplay);
  container.appendChild(chartWrapper);
}
