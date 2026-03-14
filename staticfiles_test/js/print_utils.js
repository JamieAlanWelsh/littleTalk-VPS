/**
 * Reusable Print Utility
 * Handles printing functionality across different pages
 */

/**
 * Trigger browser print dialog
 * @param {string} containerId - Optional ID of container to print (prints whole page if not specified)
 */
function printPage(containerId = null) {
    if (containerId) {
        // If a specific container is specified, temporarily hide other content
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }
        
        // Add a class to the container for print-specific styling
        container.classList.add('print-target');
    }
    
    // Trigger browser print dialog
    window.print();
    
    if (containerId) {
        // Clean up the class after printing
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.remove('print-target');
        }
    }
}

/**
 * Print screener summary
 * Specific implementation for screener summary page
 */
function printScreenerSummary() {
    // Add any pre-print processing here if needed
    printPage();
}

/**
 * Print dashboard progress
 * Specific implementation for dashboard (to be used later)
 */
function printDashboard() {
    // Add any pre-print processing here if needed
    printPage();
}
