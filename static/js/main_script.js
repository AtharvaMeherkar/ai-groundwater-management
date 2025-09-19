// AI-Powered Sustainable Groundwater Management - Clean JavaScript

// Global variables
let currentDistrict = null;
let currentChart = null;
let currentChartType = "both";
let currentForecastDays = 30;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  // Initialize smooth scrolling
  initializeSmoothScrolling();

  // Initialize district selector
  initializeDistrictSelector();

  // Initialize navigation
  initializeNavigation();

  // Load initial data
  loadInitialData();
}

function initializeSmoothScrolling() {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

function initializeDistrictSelector() {
  const districtSelect = document.getElementById("district-select");
  if (districtSelect) {
    districtSelect.addEventListener("change", function () {
      const selectedDistrict = this.value;
      if (selectedDistrict) {
        loadDistrictData(selectedDistrict);
      } else {
        hideDashboardContent();
      }
    });
  }
}

function initializeNavigation() {
  // Set active navigation based on current page URL
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const linkPath = new URL(link.href).pathname;

    // Set active class for current page
    if (
      linkPath === currentPath ||
      (currentPath === "/" && linkPath === "/") ||
      (currentPath === "/analytics" && linkPath === "/analytics") ||
      (currentPath === "/budgeting" && linkPath === "/budgeting") ||
      (currentPath === "/alerts" && linkPath === "/alerts") ||
      (currentPath === "/district-info" && linkPath === "/district-info")
    ) {
      link.classList.add("active");
    }
  });
}

function loadInitialData() {
  // Load state overview data
  fetch("/api/state-overview")
    .then((response) => response.json())
    .then((data) => {
      updateStateOverview(data);
    })
    .catch((error) => {
      console.error("Error loading state overview:", error);
    });
}

function loadDistrictData(district) {
  currentDistrict = district;
  showLoadingState();

  // Navigate to district detail page
  window.location.href = `/district/${district}`;
}

// Multi-page navigation helper
function navigateToPage(page) {
  window.location.href = page;
}

function showLoadingState() {
  const dashboardContent = document.getElementById("dashboard-content");
  if (dashboardContent) {
    dashboardContent.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner"></div>
                <p class="mt-3">Loading district data...</p>
            </div>
        `;
    dashboardContent.style.display = "block";
  }
}

function hideDashboardContent() {
  const dashboardContent = document.getElementById("dashboard-content");
  if (dashboardContent) {
    dashboardContent.style.display = "none";
  }
}

function updateStateOverview(data) {
  // Update any state-level information if needed
  console.log("State overview data:", data);
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// Multi-page navigation functions
function goToAnalytics() {
  window.location.href = "/analytics";
}

function goToBudgeting() {
  window.location.href = "/budgeting";
}

function goToAlerts() {
  window.location.href = "/alerts";
}

function goToDistrictInfo() {
  window.location.href = "/district-info";
}

// Chart management functions
function updateChart(type) {
  if (!currentDistrict) return;

  currentChartType = type;

  // Update chart type controls
  document
    .querySelectorAll(".chart-controls .btn-group:first-child .btn")
    .forEach((btn) => {
      btn.classList.remove("active");
      btn.classList.add("btn-outline-primary");
      btn.classList.remove("btn-primary");
    });

  event.target.classList.add("active");
  event.target.classList.remove("btn-outline-primary");
  event.target.classList.add("btn-primary");

  // Update chart based on type
  updateChartDisplay();
}

function updateForecastPeriod(days) {
  if (!currentDistrict) return;

  currentForecastDays = days;

  // Update forecast period controls
  document
    .querySelectorAll(".chart-controls .btn-group:last-child .btn")
    .forEach((btn) => {
      btn.classList.remove("active");
      btn.classList.add("btn-outline-secondary");
      btn.classList.remove("btn-secondary");
    });

  event.target.classList.add("active");
  event.target.classList.remove("btn-outline-secondary");
  event.target.classList.add("btn-secondary");

  // Update chart if showing forecast
  if (currentChartType === "forecast" || currentChartType === "both") {
    updateChartDisplay();
  }
}

function updateChartDisplay() {
  if (!currentDistrict) return;

  // Fetch chart data with current settings
  fetch(
    `/api/chart/${currentDistrict}?type=${currentChartType}&days=${currentForecastDays}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.chart) {
        const chartDiv = document.getElementById("water-level-chart");
        if (chartDiv) {
          Plotly.newPlot(
            chartDiv,
            JSON.parse(data.chart).data,
            JSON.parse(data.chart).layout
          );
        }
      }
    })
    .catch((error) => console.error("Error loading chart:", error));
}

// Legacy functions for backward compatibility
function showHistoricalChart() {
  updateChart("historical");
}

function showForecastChart() {
  updateChart("forecast");
}

function showBothChart() {
  updateChart("both");
}

// Utility functions
function formatNumber(num) {
  return new Intl.NumberFormat("en-IN").format(num);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStressLevelColor(level) {
  const colors = {
    Safe: "#10b981",
    Moderate: "#f59e0b",
    High: "#ef4444",
    Critical: "#dc2626",
  };
  return colors[level] || "#6b7280";
}

function getTrendIcon(trend) {
  if (trend > 0) return "fas fa-arrow-up text-success";
  if (trend < 0) return "fas fa-arrow-down text-danger";
  return "fas fa-minus text-secondary";
}

// Error handling
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-danger alert-dismissible fade show";
  errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(errorDiv, container.firstChild);
  }
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "alert alert-success alert-dismissible fade show";
  successDiv.innerHTML = `
        <strong>Success:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  const container = document.querySelector(".container");
  if (container) {
    container.insertBefore(successDiv, container.firstChild);
  }
}

// API helper functions
async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Water budget calculation
async function calculateWaterBudget(district, crop, area, irrigationMethod) {
  try {
    const data = await fetchData("/api/calculate-budget", {
      method: "POST",
      body: JSON.stringify({
        district: district,
        crop: crop,
        area: area,
        irrigation_method: irrigationMethod,
      }),
    });

    return data;
  } catch (error) {
    console.error("Error calculating water budget:", error);
    throw error;
  }
}

// District data loading
async function loadDistrictDetails(district) {
  try {
    const data = await fetchData(`/district/${district}`);
    return data;
  } catch (error) {
    console.error("Error loading district details:", error);
    throw error;
  }
}

// Animation helpers
function animateValue(element, start, end, duration) {
  const startTimestamp = performance.now();
  const step = (timestamp) => {
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    element.textContent = current;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function fadeIn(element, duration = 300) {
  element.style.opacity = "0";
  element.style.display = "block";

  let start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    element.style.opacity = progress;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function fadeOut(element, duration = 300) {
  let start = performance.now();

  function step(timestamp) {
    const progress = Math.min((timestamp - start) / duration, 1);
    element.style.opacity = 1 - progress;

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.style.display = "none";
    }
  }

  window.requestAnimationFrame(step);
}

// Responsive helpers
function isMobile() {
  return window.innerWidth <= 768;
}

function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
}

function isDesktop() {
  return window.innerWidth > 1024;
}

// Event listeners for responsive behavior
window.addEventListener("resize", function () {
  // Handle responsive changes
  if (isMobile()) {
    // Mobile-specific adjustments
    document.body.classList.add("mobile");
    document.body.classList.remove("tablet", "desktop");
  } else if (isTablet()) {
    // Tablet-specific adjustments
    document.body.classList.add("tablet");
    document.body.classList.remove("mobile", "desktop");
  } else {
    // Desktop-specific adjustments
    document.body.classList.add("desktop");
    document.body.classList.remove("mobile", "tablet");
  }
});

// Initialize responsive classes
if (isMobile()) {
  document.body.classList.add("mobile");
} else if (isTablet()) {
  document.body.classList.add("tablet");
} else {
  document.body.classList.add("desktop");
}

// Quick Action Functions
function exportData() {
  // Simulate data export
  const data = {
    district: currentDistrict,
    timestamp: new Date().toISOString(),
    waterLevel: 5.0,
    status: "Stable",
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentDistrict}_data.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification("Data exported successfully!", "success");
}

function generateReport() {
  showNotification("Generating PDF report...", "info");
  // Simulate report generation
  setTimeout(() => {
    showNotification("Report generated successfully!", "success");
  }, 2000);
}

function shareData() {
  if (navigator.share) {
    navigator.share({
      title: `${currentDistrict} Groundwater Data`,
      text: `Check out the groundwater data for ${currentDistrict}`,
      url: window.location.href,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    showNotification("Link copied to clipboard!", "success");
  }
}

function setAlerts() {
  showNotification("Alert settings opened!", "info");
  // This would open a modal or redirect to alert settings
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  notification.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Handle budget calculation form submission
function handleBudgetCalculation(event) {
  event.preventDefault();

  const crop = document.getElementById("crop-select").value;
  const area = document.getElementById("area-input").value;
  const irrigationMethod = document.getElementById("irrigation-select").value;

  if (!crop || !area) {
    showNotification("Please select a crop and enter area", "warning");
    return;
  }

  // Get current district from the page
  const district = currentDistrict || "Pune"; // fallback to Pune

  // Show loading state
  const button = event.target.querySelector('button[type="submit"]');
  const originalText = button.innerHTML;
  button.innerHTML =
    '<i class="fas fa-spinner fa-spin me-2"></i>Calculating...';
  button.disabled = true;

  // Call the budget calculation function
  calculateWaterBudget(district, crop, parseFloat(area), irrigationMethod)
    .then((data) => {
      // Display results
      displayBudgetResults(data);
      showNotification("Budget calculated successfully!", "success");
    })
    .catch((error) => {
      console.error("Budget calculation error:", error);
      showNotification("Error calculating budget. Please try again.", "error");
    })
    .finally(() => {
      // Reset button state
      button.innerHTML = originalText;
      button.disabled = false;
    });
}

// Display budget calculation results
function displayBudgetResults(data) {
  const resultDiv = document.getElementById("budget-result");
  if (!resultDiv) return;

  const budget = data.budget;
  resultDiv.innerHTML = `
    <div class="budget-results">
      <h6>Water Budget Results</h6>
      <div class="row">
        <div class="col-6">
          <div class="metric-value">${budget.weekly_requirement_mm.toFixed(
            1
          )}mm</div>
          <div class="metric-label">Weekly Requirement</div>
        </div>
        <div class="col-6">
          <div class="metric-value">${budget.sustainable_budget_mm.toFixed(
            1
          )}mm</div>
          <div class="metric-label">Sustainable Budget</div>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-6">
          <div class="metric-value">${
            budget.irrigation_frequency_per_week
          }</div>
          <div class="metric-label">Irrigation Sessions/Week</div>
        </div>
        <div class="col-6">
          <div class="metric-value">${budget.irrigation_duration_minutes.toFixed(
            0
          )}min</div>
          <div class="metric-label">Duration per Session</div>
        </div>
      </div>
      <div class="budget-status mt-3">
        <span class="badge ${
          budget.is_sustainable ? "bg-success" : "bg-warning"
        }">
          ${budget.is_sustainable ? "Sustainable" : "High Water Usage"}
        </span>
        <span class="badge bg-info ms-2">${budget.water_stress_level}</span>
      </div>
      ${
        budget.recommendations && budget.recommendations.length > 0
          ? `
        <div class="recommendations mt-3">
          <h6>Recommendations:</h6>
          <ul class="list-unstyled">
            ${budget.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
    </div>
  `;

  resultDiv.style.display = "block";
}

// District Selection Functions
function changeDistrict() {
  console.log("changeDistrict() called");

  const selector = document.getElementById("districtSelector");
  if (!selector) {
    console.error("District selector not found");
    return;
  }

  const selectedDistrict = selector.value;
  console.log("Selected district:", selectedDistrict);
  console.log("Current district:", currentDistrict);

  if (selectedDistrict && selectedDistrict !== currentDistrict) {
    // Update the current district
    currentDistrict = selectedDistrict;

    // Show loading state
    showNotification(`Loading data for ${selectedDistrict}...`, "info");

    // Get current page path and reload with selected district
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?district=${encodeURIComponent(
      selectedDistrict
    )}`;
    console.log("Redirecting to:", newUrl);

    window.location.href = newUrl;
  } else if (selectedDistrict === currentDistrict) {
    console.log("Same district selected, no action needed");
    showNotification(`Already viewing ${selectedDistrict}`, "info");
  } else {
    console.error("No district selected");
    showNotification("Please select a district", "warning");
  }
}

function loadDistrictsList() {
  // This function could be used to dynamically load districts from the API
  // For now, we have them hardcoded in the HTML
  fetch("/api/districts")
    .then((response) => response.json())
    .then((districts) => {
      const selector = document.getElementById("districtSelector");
      selector.innerHTML = "";

      districts.forEach((district) => {
        const option = document.createElement("option");
        option.value = district;
        option.textContent = district;
        if (district === "Pune") {
          option.selected = true;
        }
        selector.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error loading districts:", error);
    });
}

// Export functions for global access
window.scrollToSection = scrollToSection;
window.updateChart = updateChart;
window.updateForecastPeriod = updateForecastPeriod;
window.loadDistrictData = loadDistrictData;
window.calculateWaterBudget = calculateWaterBudget;
window.handleBudgetCalculation = handleBudgetCalculation;
window.displayBudgetResults = displayBudgetResults;
window.exportData = exportData;
window.generateReport = generateReport;
window.shareData = shareData;
window.setAlerts = setAlerts;
window.navigateToPage = navigateToPage;
window.goToAnalytics = goToAnalytics;
window.goToBudgeting = goToBudgeting;
window.goToAlerts = goToAlerts;
window.goToDistrictInfo = goToDistrictInfo;
window.changeDistrict = changeDistrict;
window.loadDistrictsList = loadDistrictsList;
