/**
 * Targets Management JavaScript
 * Handles adding, editing, and deleting targets for learners
 */

document.addEventListener('DOMContentLoaded', function() {
    const newTargetBtn = document.getElementById('new-target-btn');
    const editTargetsBtn = document.getElementById('edit-targets-btn');
    const targetsContainer = document.getElementById('targets-container');
    const targetsSection = document.querySelector('.profile-card--targets');
    const targetsFilter = document.getElementById('targets-filter');
    let isEditMode = false;
    let currentFilter = 'all';

    const SMART_SAMPLES = Array.isArray(window.SMART_SAMPLES) ? window.SMART_SAMPLES : [];
    
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

    // Event listeners for text inputs
    document.querySelectorAll('.target-text-input').forEach(input => {
        bindTextInput(input);
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

    if (targetsFilter) {
        targetsFilter.addEventListener('change', function() {
            currentFilter = this.value;
            applyFilterAndOrder();
        });
    }

    applyFilterAndOrder();
    
    /**
     * Show modal for creating a new target
     */
    function showNewTargetModal() {
        const sampleOptions = renderSampleOptions();
        // Create modal HTML
        const modalHTML = `
            <div class="new-target-modal show" id="new-target-modal">
                <div class="new-target-modal-content">
                    <h4>Add New Target</h4>
                    <label for="sample-target-select" class="sample-target-label">Choose a sample (optional)</label>
                    <select id="sample-target-select" class="sample-target-select">
                        <option value="">-- Select a sample --</option>
                        ${sampleOptions}
                    </select>
                    <p class="sample-target-hint">Replace placeholders like x% and x weeks to make it SMART.</p>
                    <textarea id="new-target-text" placeholder="Enter target" maxlength="255" rows="5"></textarea>
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

        const sampleSelect = document.getElementById('sample-target-select');
        const targetInput = document.getElementById('new-target-text');

        if (sampleSelect && targetInput) {
            sampleSelect.addEventListener('change', function() {
                if (this.value) {
                    targetInput.value = this.value;
                    targetInput.focus();
                    targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
                }
            });
        }
        
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

    function renderSampleOptions() {
        const grouped = SMART_SAMPLES.reduce((acc, sample) => {
            if (!acc[sample.group]) {
                acc[sample.group] = [];
            }
            acc[sample.group].push(sample);
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([group, samples]) => {
                const options = samples
                    .map(sample => `<option value="${escapeHtml(sample.text)}">${escapeHtml(sample.label)}</option>`)
                    .join('');
                return `<optgroup label="${escapeHtml(group)}">${options}</optgroup>`;
            })
            .join('');
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
                targetCard.dataset.status = newStatus;
            }

            applyFilterAndOrder();
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
            applyFilterAndOrder();
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
            <div class="target-card ${statusClass}" data-target-id="${target.id}" data-status="${target.status}">
                <div class="target-content">
                    <span class="target-text">${escapeHtml(target.text)}</span>
                    <textarea
                        class="target-text-input"
                        data-target-id="${target.id}"
                        maxlength="255"
                        aria-label="Edit target"
                        rows="3"
                    >${escapeHtml(target.text)}</textarea>
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

        const newTextInput = document.querySelector(`.target-text-input[data-target-id="${target.id}"]`);
        if (newTextInput) {
            bindTextInput(newTextInput);
        }

        applyFilterAndOrder();
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
        isEditMode = !isEditMode;
        if (targetsSection) {
            targetsSection.classList.toggle('edit-mode', isEditMode);
        }

        if (editTargetsBtn) {
            editTargetsBtn.textContent = isEditMode ? 'Done Editing' : 'Edit Targets';
        }
    }

    function applyFilterAndOrder() {
        const targetCards = Array.from(targetsContainer.querySelectorAll('.target-card'));
        const visibleCards = [];

        targetCards.forEach(card => {
            const status = card.dataset.status || '---';
            const matches = currentFilter === 'all' || status === currentFilter;
            card.style.display = matches ? '' : 'none';
            if (matches) {
                visibleCards.push(card);
            }
        });

        if (currentFilter === 'all') {
            const statusOrder = {
                achieved: 0,
                ongoing: 1,
                not_achieved: 2,
                '---': 3
            };

            visibleCards.sort((a, b) => {
                const aStatus = a.dataset.status || '---';
                const bStatus = b.dataset.status || '---';
                return (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99);
            });

            visibleCards.forEach(card => {
                targetsContainer.appendChild(card);
            });
        }

        updateFilterEmptyMessage(visibleCards.length, targetCards.length);
    }

    function updateFilterEmptyMessage(visibleCount, totalCount) {
        const existing = targetsContainer.querySelector('.filter-empty-message');

        if (totalCount === 0) {
            if (existing) {
                existing.remove();
            }
            return;
        }

        if (visibleCount === 0) {
            if (!existing) {
                const message = document.createElement('p');
                message.className = 'filter-empty-message';
                message.textContent = 'No targets match this filter.';
                targetsContainer.appendChild(message);
            }
        } else if (existing) {
            existing.remove();
        }
    }

    function bindTextInput(input) {
        const targetId = input.dataset.targetId;

        input.addEventListener('focus', function() {
            input.dataset.originalText = input.value;
        });

        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                input.blur();
            }

            if (event.key === 'Escape') {
                if (input.dataset.originalText !== undefined) {
                    input.value = input.dataset.originalText;
                }
                input.blur();
            }
        });

        input.addEventListener('blur', function() {
            const newText = input.value.trim();
            const originalText = input.dataset.originalText || '';

            if (!newText) {
                input.value = originalText;
                return;
            }

            if (newText === originalText) {
                return;
            }

            updateTargetText(targetId, newText, input, originalText);
        });
    }

    function updateTargetText(targetId, newText, input, originalText) {
        fetch(`/api/targets/${targetId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                text: newText
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update target');
            }
            return response.json();
        })
        .then(data => {
            const targetCard = document.querySelector(`[data-target-id="${targetId}"]`);
            const textSpan = targetCard ? targetCard.querySelector('.target-text') : null;
            if (textSpan) {
                textSpan.textContent = data.text;
            }
            input.dataset.originalText = data.text;
        })
        .catch(error => {
            console.error('Error:', error);
            input.value = originalText;
            alert('Failed to update target text');
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
