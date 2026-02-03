/**
 * Targets Management JavaScript
 * Handles adding, editing, and deleting targets for learners
 */

document.addEventListener('DOMContentLoaded', function() {
    const newTargetBtn = document.getElementById('new-target-btn');
    const editTargetsBtn = document.getElementById('edit-targets-btn');
    const targetsContainer = document.getElementById('targets-container');
    
    if (!targetsContainer) return; // Exit if not on profile page
    
    // Get learner ID from the page context
    const selectedLearnerElement = document.querySelector('[data-learner-id]');
    let learnerId = selectedLearnerElement ? selectedLearnerElement.dataset.learnerId : null;
    
    // Fallback: extract from URL or form data
    if (!learnerId) {
        const forms = document.querySelectorAll('form[name="learner_form"]');
        if (forms.length > 0) {
            const learnerIdInput = forms[0].querySelector('input[name="learner_id"]');
            if (learnerIdInput) {
                learnerId = learnerIdInput.value;
            }
        }
    }
    
    // Event listeners for status dropdown changes
    document.querySelectorAll('.target-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            handleStatusChange(this);
        });
    });
    
    // Event listeners for delete buttons
    document.querySelectorAll('.target-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            handleDeleteTarget(this);
        });
    });
    
    // New Target button
    if (newTargetBtn) {
        newTargetBtn.addEventListener('click', function() {
            showNewTargetModal();
        });
    }
    
    // Edit Targets button
    if (editTargetsBtn) {
        editTargetsBtn.addEventListener('click', function() {
            toggleEditMode();
        });
    }
    
    /**
     * Show modal for creating a new target
     */
    function showNewTargetModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="new-target-modal show" id="new-target-modal">
                <div class="new-target-modal-content">
                    <h4>Add New Target</h4>
                    <input type="text" id="new-target-text" placeholder="Enter target description" maxlength="255">
                    <div class="modal-buttons">
                        <button class="btn-cancel" onclick="document.getElementById('new-target-modal').remove();">Cancel</button>
                        <button class="btn-save" onclick="saveNewTarget();">Add Target</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('new-target-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on input
        document.getElementById('new-target-text').focus();
        
        // Handle Enter key
        document.getElementById('new-target-text').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveNewTarget();
            }
        });
        
        // Close modal on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('new-target-modal');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }
    
    /**
     * Save new target
     */
    window.saveNewTarget = function() {
        const targetText = document.getElementById('new-target-text').value.trim();
        
        if (!targetText) {
            alert('Please enter a target description');
            return;
        }
        
        // Get learner UUID from the page
        const learnerUuid = window.currentLearnerUuid;
        if (!learnerUuid) {
            alert('Unable to identify learner');
            return;
        }
        
        // Send request to add target
        fetch(`/api/targets/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                learner_uuid: learnerUuid,
                text: targetText,
                status: '---'
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create target');
            }
            return response.json();
        })
        .then(data => {
            // Close modal
            const modal = document.getElementById('new-target-modal');
            if (modal) {
                modal.remove();
            }
            
            // Add new target to the page
            addTargetToDOM(data);
            
            // Update no targets message
            updateNoTargetsMessage();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to add target. Please try again.');
        });
    };
    
    /**
     * Handle status change
     */
    function handleStatusChange(dropdown) {
        const targetId = dropdown.dataset.targetId;
        const newStatus = dropdown.value;
        
        fetch(`/api/targets/${targetId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                status: newStatus
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update target');
            }
            return response.json();
        })
        .then(data => {
            // Update card styling based on new status
            const targetCard = document.querySelector(`[data-target-id="${targetId}"]`);
            if (targetCard) {
                // Remove old status class
                targetCard.className = targetCard.className.replace(/target-status-\S+/, '');
                // Add new status class
                targetCard.classList.add(`target-status-${newStatus}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update target status');
            // Revert dropdown
            location.reload();
        });
    }
    
    /**
     * Handle delete target
     */
    function handleDeleteTarget(btn) {
        if (!confirm('Are you sure you want to delete this target?')) {
            return;
        }
        
        const targetId = btn.dataset.targetId;
        
        fetch(`/api/targets/${targetId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete target');
            }
            
            // Remove card from DOM
            const targetCard = document.querySelector(`[data-target-id="${targetId}"]`);
            if (targetCard) {
                targetCard.remove();
            }
            
            // Update no targets message
            updateNoTargetsMessage();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete target');
        });
    }
    
    /**
     * Add target to DOM
     */
    function addTargetToDOM(target) {
        const statusClass = `target-status-${target.status}`;
        const targetHTML = `
            <div class="target-card ${statusClass}" data-target-id="${target.id}">
                <div class="target-content">
                    <span class="target-text">${escapeHtml(target.text)}</span>
                    <select class="target-status-dropdown" data-target-id="${target.id}">
                        <option value="---" ${target.status === '---' ? 'selected' : ''}>----</option>
                        <option value="achieved" ${target.status === 'achieved' ? 'selected' : ''}>Achieved</option>
                        <option value="not_achieved" ${target.status === 'not_achieved' ? 'selected' : ''}>Not Achieved</option>
                        <option value="ongoing" ${target.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                    </select>
                </div>
                <button class="target-delete-btn" data-target-id="${target.id}" title="Delete target">×</button>
            </div>
        `;
        
        // Remove "No targets" message if it exists
        const noTargetsMsg = document.querySelector('.no-targets-message');
        if (noTargetsMsg) {
            noTargetsMsg.remove();
        }
        
        // Add target to container
        targetsContainer.insertAdjacentHTML('beforeend', targetHTML);
        
        // Attach event listeners to new elements
        const newDropdown = document.querySelector(`.target-status-dropdown[data-target-id="${target.id}"]`);
        const newDeleteBtn = document.querySelector(`.target-delete-btn[data-target-id="${target.id}"]`);
        
        if (newDropdown) {
            newDropdown.addEventListener('change', function() {
                handleStatusChange(this);
            });
        }
        
        if (newDeleteBtn) {
            newDeleteBtn.addEventListener('click', function() {
                handleDeleteTarget(this);
            });
        }
    }
    
    /**
     * Update no targets message visibility
     */
    function updateNoTargetsMessage() {
        const targets = document.querySelectorAll('.target-card');
        if (targets.length === 0) {
            const noTargetsMsg = `<p class="no-targets-message">No targets added yet.</p>`;
            targetsContainer.innerHTML = noTargetsMsg;
        }
    }
    
    /**
     * Toggle edit mode
     */
    function toggleEditMode() {
        const targetCards = document.querySelectorAll('.target-card');
        targetCards.forEach(card => {
            card.classList.toggle('edit-mode');
        });
    }
});

/**
 * Get CSRF token from cookies
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
