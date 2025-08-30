import { useState, useCallback } from 'react';

export function useFormState<T extends Record<string, any>>(
  initialValues: T, 
  onSubmit: (values: T) => void | Promise<void>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    // Basic validation - can be extended
    const value = values[field];
    if (value === null || value === undefined || value === '') {
      setError(field, 'This field is required');
      return false;
    }
    return true;
  }, [values, setError]);

  const validate = useCallback((): boolean => {
    let isValid = true;
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;

    Object.keys(values).forEach((key) => {
      const field = key as keyof T;
      const value = values[field];
      
      // Basic required validation
      if (value === null || value === undefined || value === '') {
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setIsDirty(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string>);
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    // State
    values,
    errors,
    isSubmitting,
    isDirty,

    // Actions
    setValue,
    setError,
    handleSubmit,
    reset,

    // Validation
    validate,
    validateField
  };
}
