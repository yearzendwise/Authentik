import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormElement {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormData {
  id: string;
  title: string;
  description?: string;
  formData: {
    elements: FormElement[];
  };
  theme: string;
}

interface FormViewProps {
  formId: string;
}

const FormView: React.FC<FormViewProps> = ({ formId }) => {
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/forms/${formId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Form not found or inactive');
          } else {
            setError('Failed to load form');
          }
          return;
        }

        const formData = await response.json();
        setForm(formData);
        
        // Initialize form values
        const initialValues: Record<string, any> = {};
        formData.formData.elements?.forEach((element: FormElement) => {
          initialValues[element.id] = '';
        });
        setFormValues(initialValues);
        
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleInputChange = (elementId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseData: formValues
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormElement = (element: FormElement) => {
    const { id, type, label, required, placeholder, options } = element;

    switch (type) {
      case 'text':
      case 'text-input':
      case 'email':
      case 'email-input':
      case 'tel':
      case 'url':
      case 'full-name':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={id}
              type={type}
              placeholder={placeholder}
              required={required}
              value={formValues[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={id}
              placeholder={placeholder}
              required={required}
              value={formValues[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
            />
          </div>
        );

      case 'select':
        return (
          <div key={id} className="space-y-2">
            <Label htmlFor={id}>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <select
              id={id}
              required={required}
              value={formValues[id] || ''}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select an option...</option>
              {options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={id} className="space-y-2">
            <Label>
              {label} {required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${id}-${index}`}
                    name={id}
                    value={option}
                    required={required}
                    checked={formValues[id] === option}
                    onChange={(e) => handleInputChange(id, e.target.value)}
                    className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <Label htmlFor={`${id}-${index}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={id}
                required={required}
                checked={formValues[id] || false}
                onChange={(e) => handleInputChange(id, e.target.checked)}
                className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <Label htmlFor={id} className="font-normal">
                {label} {required && <span className="text-destructive">*</span>}
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Form not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Success!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for your submission. Your response has been recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            {form.description && (
              <CardDescription>{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.formData.elements?.map(renderFormElement)}
              
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormView;