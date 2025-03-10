document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const statusContent = document.getElementById("status-content");
  const tasksContent = document.getElementById("tasks-content");
  const logsContainer = document.getElementById("logs-container");
  const refreshStatusBtn = document.getElementById("refresh-status");
  const refreshTasksBtn = document.getElementById("refresh-tasks");
  const refreshLogsBtn = document.getElementById("refresh-logs");
  const turnOffTvBtn = document.getElementById("turn-off-tv-btn");

  // Log tailing variables
  let logTailingEnabled = true;
  let logTailingInterval = null;
  let lastLogCount = 0;

  // TV status polling variables
  let tvStatusPollingInterval = null;
  let lastTvStatus = null;

  // Initial data load
  fetchStatus();
  fetchTasks();
  fetchLogs();

  // Start log tailing
  startLogTailing();

  // Start TV status polling (every 2 seconds)
  startTvStatusPolling();

  // Event listeners
  refreshStatusBtn.addEventListener("click", fetchStatus);
  refreshTasksBtn.addEventListener("click", fetchTasks);
  refreshLogsBtn.addEventListener("click", () => {
    fetchLogs();
    // If tailing was disabled, re-enable it on manual refresh
    if (!logTailingEnabled) {
      startLogTailing();
    }
  });
  turnOffTvBtn.addEventListener("click", turnOffTv);

  // Detect when user scrolls up to disable auto-tailing
  logsContainer.addEventListener("scroll", () => {
    const isScrolledToBottom =
      logsContainer.scrollHeight - logsContainer.clientHeight <=
      logsContainer.scrollTop + 50;

    if (!isScrolledToBottom && logTailingEnabled) {
      logTailingEnabled = false;
      stopLogTailing();
      // Add a notification that tailing is paused
      const notification = document.createElement("div");
      notification.className = "log-tailing-paused";
      notification.textContent =
        "Log tailing paused. Click 'Refresh Logs' to resume.";
      notification.style.position = "sticky";
      notification.style.top = "0";
      notification.style.backgroundColor = "rgba(255, 200, 0, 0.8)";
      notification.style.padding = "5px";
      notification.style.textAlign = "center";
      notification.style.zIndex = "100";
      notification.style.color = "#000";
      logsContainer.prepend(notification);
    }
  });

  // Functions
  async function fetchStatus() {
    try {
      statusContent.innerHTML = "<p>Loading status...</p>";

      const response = await fetch("/api/status");
      const data = await response.json();

      if (data.success) {
        updateStatusDisplay(data.status);
      } else {
        statusContent.innerHTML = `<p class="error-message">Error: ${data.message}</p>`;
      }
    } catch (error) {
      statusContent.innerHTML = `<p class="error-message">Failed to fetch status: ${error.message}</p>`;
      console.error("Error fetching status:", error);
    }
  }

  // New function to update just the status display
  function updateStatusDisplay(status) {
    let statusHtml = '<div class="status-details">';

    // Format the status data
    // Format last check time
    const lastCheckTime = status.lastCheckTime
      ? new Date(status.lastCheckTime).toLocaleString()
      : "Never";

    statusHtml += `<p><strong>Last Check:</strong> ${lastCheckTime}</p>`;

    // TV Status with indicator
    const tvConnected = status.tvConnected;
    const tvStatusClass = tvConnected ? "online" : "offline";
    const tvStatusText = tvConnected ? "Connected" : "Disconnected";

    statusHtml += `
      <p>
        <strong>TV Status:</strong> 
        <span class="status-indicator ${tvStatusClass}"></span>
        ${tvStatusText}
      </p>`;

    // Always show the TV button, but enable/disable based on TV status
    turnOffTvBtn.style.display = "inline-block";
    if (tvConnected) {
      turnOffTvBtn.disabled = false;
      turnOffTvBtn.classList.add("active");
      turnOffTvBtn.classList.remove("inactive");
    } else {
      turnOffTvBtn.disabled = true;
      turnOffTvBtn.classList.add("inactive");
      turnOffTvBtn.classList.remove("active");
    }

    // Task count
    statusHtml += `<p><strong>Outstanding Tasks:</strong> ${status.lastTaskCount}</p>`;

    // Scheduler status
    const schedulerStatus = status.schedulerRunning ? "Running" : "Stopped";
    statusHtml += `<p><strong>Scheduler:</strong> ${schedulerStatus}</p>`;

    // Check interval
    const checkIntervalMinutes = Math.round(status.checkInterval / 60000);
    statusHtml += `<p><strong>Check Interval:</strong> ${checkIntervalMinutes} minutes</p>`;

    // Monitored tag
    statusHtml += `<p><strong>Monitored Tag:</strong> ${status.monitoredTag}</p>`;

    statusHtml += "</div>";
    statusContent.innerHTML = statusHtml;
  }

  // New function to update just the TV status portion
  function updateTvStatusDisplay(tvStatus) {
    // Find the TV status element
    const statusDetails = document.querySelector(".status-details");
    if (!statusDetails) return; // Status not loaded yet

    // Find the TV status paragraph
    const tvStatusParagraph = Array.from(
      statusDetails.querySelectorAll("p")
    ).find((p) => p.innerHTML.includes("TV Status:"));

    if (!tvStatusParagraph) return; // TV status element not found

    // Update the TV status
    const tvConnected = tvStatus.tvConnected;
    const tvStatusClass = tvConnected ? "online" : "offline";
    const tvStatusText = tvConnected ? "Connected" : "Disconnected";

    tvStatusParagraph.innerHTML = `
      <strong>TV Status:</strong> 
      <span class="status-indicator ${tvStatusClass}"></span>
      ${tvStatusText}
    `;

    // Update the TV button state
    if (tvConnected) {
      turnOffTvBtn.disabled = false;
      turnOffTvBtn.classList.add("active");
      turnOffTvBtn.classList.remove("inactive");
    } else {
      turnOffTvBtn.disabled = true;
      turnOffTvBtn.classList.add("inactive");
      turnOffTvBtn.classList.remove("active");
    }

    // Add a subtle flash effect if the status changed
    if (lastTvStatus !== null && lastTvStatus !== tvConnected) {
      tvStatusParagraph.classList.add("status-changed");
      setTimeout(() => {
        tvStatusParagraph.classList.remove("status-changed");
      }, 1000);
    }

    // Update last known status
    lastTvStatus = tvConnected;
  }

  // New function to fetch just the TV status
  async function fetchTvStatus() {
    try {
      const response = await fetch("/api/tv/status");
      const data = await response.json();

      if (data.success) {
        updateTvStatusDisplay(data.status);
      }
    } catch (error) {
      console.error("Error fetching TV status:", error);
    }
  }

  // Start polling for TV status
  function startTvStatusPolling() {
    if (tvStatusPollingInterval) {
      clearInterval(tvStatusPollingInterval);
    }
    // Poll every 2 seconds
    tvStatusPollingInterval = setInterval(fetchTvStatus, 2000);
  }

  // Stop polling for TV status
  function stopTvStatusPolling() {
    if (tvStatusPollingInterval) {
      clearInterval(tvStatusPollingInterval);
      tvStatusPollingInterval = null;
    }
  }

  async function fetchTasks() {
    try {
      tasksContent.innerHTML = "<p>Loading tasks...</p>";

      const response = await fetch("/api/tasks");
      const data = await response.json();

      if (data.success) {
        if (!data.tasks || data.tasks.length === 0) {
          tasksContent.innerHTML = "<p>No outstanding tasks found.</p>";
          return;
        }

        let tasksHtml = "";
        data.tasks.forEach((task) => {
          const dueDate = task.dueDate
            ? `<div class="task-due">Due: ${new Date(task.dueDate).toLocaleDateString()}</div>`
            : "";

          // Ensure tags is an array before calling join
          const tagsArray = Array.isArray(task.tags) ? task.tags : [];
          const tags =
            tagsArray.length > 0
              ? `<div class="task-tags">Tags: ${tagsArray.join(", ")}</div>`
              : "";

          tasksHtml += `
            <div class="task-item">
              <h3>${task.name}</h3>
              ${dueDate}
              ${tags}
            </div>
          `;
        });

        tasksContent.innerHTML = tasksHtml;
      } else {
        tasksContent.innerHTML = `<p class="error-message">Error: ${data.message}</p>`;
      }
    } catch (error) {
      tasksContent.innerHTML = `<p class="error-message">Failed to fetch tasks: ${error.message}</p>`;
      console.error("Error fetching tasks:", error);
    }
  }

  async function fetchLogs() {
    try {
      logsContainer.innerHTML = "<p>Loading logs...</p>";

      const response = await fetch("/api/logs");
      const data = await response.json();

      if (data.success) {
        if (!data.logs || data.logs.length === 0) {
          logsContainer.innerHTML =
            "<p>No logs found. The application may have just started or logs have not been generated yet.</p>";
          lastLogCount = 0;
          return;
        }

        console.log(`Received ${data.logs.length} logs from server`);
        updateLogsDisplay(data.logs);
      } else {
        logsContainer.innerHTML = `<p class="error-message">Error: ${data.message}</p>`;
        console.error("Server returned error for logs:", data);
      }
    } catch (error) {
      logsContainer.innerHTML = `<p class="error-message">Failed to fetch logs: ${error.message}</p>`;
      console.error("Error fetching logs:", error);
    }
  }

  async function turnOffTv() {
    try {
      turnOffTvBtn.disabled = true;
      turnOffTvBtn.textContent = "Turning off...";

      const response = await fetch("/api/tv/turn-off", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        alert("TV turn off command sent successfully!");
        // Refresh status after turning off TV
        await fetchStatus();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Failed to turn off TV: ${error.message}`);
      console.error("Error turning off TV:", error);
    } finally {
      turnOffTvBtn.disabled = false;
      turnOffTvBtn.textContent = "Turn Off TV";
    }
  }

  function startLogTailing() {
    logTailingEnabled = true;
    if (logTailingInterval) {
      clearInterval(logTailingInterval);
    }
    logTailingInterval = setInterval(fetchLogUpdates, 5000); // Update every 5 seconds
  }

  function stopLogTailing() {
    if (logTailingInterval) {
      clearInterval(logTailingInterval);
      logTailingInterval = null;
    }
  }

  async function fetchLogUpdates() {
    if (!logTailingEnabled) return;

    try {
      const response = await fetch("/api/logs");
      const data = await response.json();

      if (data.success && data.logs && data.logs.length > 0) {
        // Only update if there are new logs
        if (data.logs.length > lastLogCount) {
          console.log(
            `New logs available: ${data.logs.length - lastLogCount} new entries`
          );
          updateLogsDisplay(data.logs);
        }
      }
    } catch (error) {
      console.error("Error fetching log updates:", error);
    }
  }

  function updateLogsDisplay(logs) {
    lastLogCount = logs.length;

    let logsHtml = "";
    logs.forEach((log, index) => {
      try {
        const logClass = log.level ? log.level.toLowerCase() : "info";
        const timestamp = log.timestamp
          ? new Date(log.timestamp).toLocaleString()
          : "Unknown";
        const level = log.level || "INFO";
        const message = log.message || "No message";

        logsHtml += `<div class="log-entry ${logClass}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-level">[${level}]</span>
          <span class="log-message">${message}</span>
        </div>`;
      } catch (err) {
        console.error(`Error formatting log at index ${index}:`, err, log);
      }
    });

    if (logsHtml === "") {
      logsContainer.innerHTML =
        "<p>Failed to format logs. Check console for details.</p>";
    } else {
      logsContainer.innerHTML = logsHtml;
      // Scroll to bottom to show latest logs if tailing is enabled
      if (logTailingEnabled) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
      }
    }
  }

  // Auto-refresh status, tasks, and logs every 30 seconds
  setInterval(fetchStatus, 30000);
  setInterval(fetchTasks, 30000);
  setInterval(fetchLogs, 30000);

  // Clean up intervals when page is unloaded
  window.addEventListener("beforeunload", () => {
    stopLogTailing();
    stopTvStatusPolling();
  });
});
