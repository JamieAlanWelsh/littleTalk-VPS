/**
 * Password Requirements Widget
 * Displays live validation of password strength based on:
 * 1. At least 8 characters
 * 2. At least 1 alphabetical character
 * 3. At least 1 number or special character
 * 
 * Usage: Attach to password input with data-password-requirements attribute
 * <input type="password" id="password" data-password-requirements>
 * <div id="password-requirements"></div>
 * <script src="password-requirements.js"></script>
 */

document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.querySelector('[data-password-requirements]');
  if (!passwordInput) return;

  const requirementsContainer = document.querySelector('[data-password-requirements-display]');
  if (!requirementsContainer) return;

  // Define requirements
  const requirements = [
    {
      id: 'min-length',
      label: 'Be at least 8 characters',
      test: (password) => password.length >= 8
    },
    {
      id: 'alphabetical',
      label: 'Include 1 alphabetical character',
      test: (password) => /[a-zA-Z]/.test(password)
    },
    {
      id: 'number-or-special',
      label: 'Include 1 number or special character',
      test: (password) => /[\d\W]/.test(password)
    }
  ];

  /**
   * Update the visual state of requirements
   */
  function updateRequirements(password) {
    requirements.forEach(req => {
      const element = document.querySelector(`[data-requirement-id="${req.id}"]`);
      if (!element) return;

      const isMet = req.test(password);
      const checkIcon = element.querySelector('[data-check-icon]');
      const xIcon = element.querySelector('[data-x-icon]');

      if (isMet) {
        element.classList.remove('requirement-unmet');
        element.classList.add('requirement-met');
        if (checkIcon) checkIcon.style.display = 'inline';
        if (xIcon) xIcon.style.display = 'none';
      } else {
        element.classList.remove('requirement-met');
        element.classList.add('requirement-unmet');
        if (checkIcon) checkIcon.style.display = 'none';
        if (xIcon) xIcon.style.display = 'inline';
      }
    });
  }

  /**
   * Check if all requirements are met
   */
  function allRequirementsMet(password) {
    return requirements.every(req => req.test(password));
  }

  /**
   * Check if all required form fields are filled
   */
  function allRequiredFieldsFilled(form) {
    const requiredInputs = form.querySelectorAll('[required]');
    return Array.from(requiredInputs).every(input => {
      if (input.type === 'checkbox') {
        return input.checked;
      }
      return input.value.trim() !== '';
    });
  }

  /**
   * Update submit button disabled state
   */
  function updateSubmitButtonState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    const password = passwordInput.value;
    const fieldsValid = allRequiredFieldsFilled(form);
    const passwordValid = password.length === 0 ? false : allRequirementsMet(password);
    
    submitButton.disabled = !fieldsValid || !passwordValid;
  }

  // Get the form
  const form = passwordInput.closest('form');
  if (!form) return;

  // Attach event listener to password input
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    updateRequirements(password);
    updateSubmitButtonState(form);
  });

  // Attach event listeners to all required fields
  const requiredInputs = form.querySelectorAll('[required]');
  requiredInputs.forEach(input => {
    input.addEventListener('input', () => updateSubmitButtonState(form));
    input.addEventListener('change', () => updateSubmitButtonState(form));
    
    // Handle select2 change events
    if (input.classList.contains('school-select') && window.jQuery) {
      jQuery(input).on('change.select2', function() {
        updateSubmitButtonState(form);
      });
    }
  });

  // Initialize on page load (in case any fields have values)
  updateRequirements(passwordInput.value);
  updateSubmitButtonState(form);
});
