import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// Define the form validation schema with Zod
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

// Infer the form field types from the schema
const FormExample = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  
  // Initialize react-hook-form with zod validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  // Form submission handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Example API call - replace with your actual API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit the form');
      }
      
      // Reset form on successful submission
      reset();
      setFormSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit the form. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
      
      {formSuccess && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          Thank you! Your message has been sent successfully.
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`w-full px-3 py-2 border rounded-md ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('message')}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default FormExample; 