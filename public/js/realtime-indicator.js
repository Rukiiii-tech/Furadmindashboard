/**
 * Real-time refresh indicator component
 * Shows a subtle indicator when data is being refreshed
 */

let refreshIndicator = null;
let notificationQueue = [];
let isShowingNotification = false;

/**
 * Creates and shows a refresh indicator
 * @param {string} message - The message to display
 */
export function showRefreshIndicator(message = "Refreshing data...") {
  // Remove existing indicator if any
  hideRefreshIndicator();
  
  // Create indicator element
  refreshIndicator = document.createElement('div');
  refreshIndicator.id = 'refreshIndicator';
  refreshIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4a90e2;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    border-left: 4px solid #2c5aa0;
  `;
  
  // Add refresh icon
  refreshIndicator.innerHTML = `
    <div style="
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    <span>${message}</span>
  `;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(refreshIndicator);
  
  // Animate in
  setTimeout(() => {
    if (refreshIndicator) {
      refreshIndicator.style.opacity = '1';
      refreshIndicator.style.transform = 'translateY(0)';
    }
  }, 10);
}

/**
 * Hides the refresh indicator
 */
export function hideRefreshIndicator() {
  if (refreshIndicator) {
    refreshIndicator.style.opacity = '0';
    refreshIndicator.style.transform = 'translateY(100%)';
    
    setTimeout(() => {
      if (refreshIndicator && refreshIndicator.parentNode) {
        refreshIndicator.parentNode.removeChild(refreshIndicator);
      }
      refreshIndicator = null;
    }, 300);
  }
}

/**
 * Shows a success indicator
 * @param {string} message - The success message to display
 */
export function showSuccessIndicator(message = "Data updated!") {
  hideRefreshIndicator();
  
  refreshIndicator = document.createElement('div');
  refreshIndicator.id = 'successIndicator';
  refreshIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    border-left: 4px solid #1e7e34;
  `;
  
  refreshIndicator.innerHTML = `
    <div style="
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #28a745;
    ">✓</div>
    <span>${message}</span>
  `;
  
  document.body.appendChild(refreshIndicator);
  
  // Animate in
  setTimeout(() => {
    if (refreshIndicator) {
      refreshIndicator.style.opacity = '1';
      refreshIndicator.style.transform = 'translateY(0)';
    }
  }, 10);
  
  // Auto hide after 3 seconds
  setTimeout(() => {
    hideRefreshIndicator();
  }, 3000);
}

/**
 * Shows a notification at the bottom right with queue support
 * @param {string} message - The notification message
 * @param {string} type - The notification type (success, info, warning, error)
 * @param {number} duration - How long to show the notification (in milliseconds)
 */
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = {
    id: Date.now(),
    message,
    type,
    duration
  };
  
  notificationQueue.push(notification);
  processNotificationQueue();
}

/**
 * Processes the notification queue
 */
function processNotificationQueue() {
  if (isShowingNotification || notificationQueue.length === 0) {
    return;
  }
  
  const notification = notificationQueue.shift();
  isShowingNotification = true;
  
  // Create notification element
  const notificationElement = document.createElement('div');
  notificationElement.id = `notification-${notification.id}`;
  
  // Get colors based on type
  const colors = {
    success: { bg: '#28a745', border: '#1e7e34', icon: '✓' },
    info: { bg: '#17a2b8', border: '#117a8b', icon: 'ℹ' },
    warning: { bg: '#ffc107', border: '#d39e00', icon: '⚠' },
    error: { bg: '#dc3545', border: '#bd2130', icon: '✕' }
  };
  
  const color = colors[notification.type] || colors.info;
  
  notificationElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${color.bg};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    border-left: 4px solid ${color.border};
    margin-bottom: ${notificationQueue.length * 10}px;
  `;
  
  notificationElement.innerHTML = `
    <div style="
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: ${color.bg};
      font-weight: bold;
    ">${color.icon}</div>
    <span>${notification.message}</span>
  `;
  
  document.body.appendChild(notificationElement);
  
  // Animate in
  setTimeout(() => {
    notificationElement.style.opacity = '1';
    notificationElement.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto hide
  setTimeout(() => {
    notificationElement.style.opacity = '0';
    notificationElement.style.transform = 'translateY(100%)';
    
    setTimeout(() => {
      if (notificationElement.parentNode) {
        notificationElement.parentNode.removeChild(notificationElement);
      }
      isShowingNotification = false;
      processNotificationQueue();
    }, 300);
  }, notification.duration);
}

/**
 * Convenience functions for different notification types
 */
export function showSuccessNotification(message, duration = 3000) {
  showNotification(message, 'success', duration);
}

export function showInfoNotification(message, duration = 3000) {
  showNotification(message, 'info', duration);
}

export function showWarningNotification(message, duration = 3000) {
  showNotification(message, 'warning', duration);
}

export function showErrorNotification(message, duration = 3000) {
  showNotification(message, 'error', duration);
}
