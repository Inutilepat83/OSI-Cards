/**
 * Form label utilities
 * Ensures all form inputs have proper labels and error messages
 */

/**
 * Create a label element for an input
 */
export function createFormLabel(
  inputId: string,
  labelText: string,
  required = false
): {
  id: string;
  htmlFor: string;
  text: string;
  required: boolean;
} {
  return {
    id: `label-${inputId}`,
    htmlFor: inputId,
    text: labelText + (required ? ' *' : ''),
    required,
  };
}

/**
 * Create an error message element for an input
 */
export function createFormError(
  inputId: string,
  errorMessage: string
): {
  id: string;
  ariaLive: 'polite' | 'assertive';
  role: 'alert';
  text: string;
} {
  return {
    id: `error-${inputId}`,
    ariaLive: 'assertive',
    role: 'alert',
    text: errorMessage,
  };
}

/**
 * Create a helper text element for an input
 */
export function createFormHelper(
  inputId: string,
  helperText: string
): {
  id: string;
  text: string;
} {
  return {
    id: `helper-${inputId}`,
    text: helperText,
  };
}

/**
 * Validate form field has associated label
 */
export function hasAssociatedLabel(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  const id = input.id;
  if (!id) {
    return false;
  }

  // Check for explicit label with 'for' attribute
  const label = document.querySelector(`label[for="${id}"]`);
  if (label) {
    return true;
  }

  // Check for implicit label (input inside label)
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return true;
  }

  // Check for aria-label
  if (input.getAttribute('aria-label')) {
    return true;
  }

  // Check for aria-labelledby
  if (input.getAttribute('aria-labelledby')) {
    return true;
  }

  return false;
}

/**
 * Ensure form field has proper accessibility attributes
 */
export function ensureFormFieldAccessibility(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  labelText: string,
  errorMessage?: string
): void {
  // Ensure ID exists
  if (!input.id) {
    input.id = `input-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // Ensure aria-label if no label found
  if (!hasAssociatedLabel(input)) {
    input.setAttribute('aria-label', labelText);
  }

  // Add error message if provided
  if (errorMessage) {
    const errorId = `error-${input.id}`;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', errorId);
  } else {
    input.removeAttribute('aria-invalid');
  }
}
