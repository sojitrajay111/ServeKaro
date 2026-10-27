import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, CheckCircle, ChefHat, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError, FormError } from '@/components/AuthShell';
import { useSignupMutation } from '@/store/endpoints/auth';
import { isApiError } from '@/lib/apiError';

const schema = z.object({
  restaurantName: z.string().trim().min(2, 'Enter the restaurant name').max(80),
  outletName: z.string().trim().min(2, 'Enter the outlet name').max(80),
  city: z.string().trim().min(2, 'Enter the city').max(60),
  ownerName: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().refine((v) => /^(\+?91)?0?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')), 'Enter a 10-digit mobile number'),
  password: z.string().min(8, 'At least 8 characters').max(100),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type Form = z.infer<typeof schema>;
const STEP_FIELDS: (keyof Form)[][] = [
  ['restaurantName', 'outletName', 'city'],
  ['ownerName', 'email', 'phone', 'password', 'confirm'],
];

const RestaurantSignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');
  const [signup, { isLoading }] = useSignupMutation();

  const { register, handleSubmit, trigger, setValue, getValues, setError, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { restaurantName: '', outletName: '', city: '', ownerName: '', email: '', phone: '', password: '', confirm: '' },
  });

  const next = async () => {
    if (await trigger(STEP_FIELDS[0])) {
      if (!getValues('outletName')) setValue('outletName', getValues('restaurantName'));
      setStep(1);
    }
  };

  const onSubmit = async ({ confirm: _confirm, ...data }: Form) => {
    setFormError('');
    try {
      await signup(data).unwrap();
      toast.success('Your restaurant is ready. Add your GSTIN and menu next.');
      navigate('/admin/settings');
    } catch (err) {
      if (isApiError(err) && err.errors) {
        Object.entries(err.errors).forEach(([field, [msg]]) => setError(field as keyof Form, { message: msg }));
        if (STEP_FIELDS[0].some((f) => err.errors?.[f])) setStep(0);
      } else {
        setFormError(isApiError(err) && err.code === 'DUPLICATE' ? 'An account with this email or phone already exists. Try logging in.' : isApiError(err) ? err.message : 'Signup failed');
      }
    }
  };

  const field = (name: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} className="mt-1" {...register(name)} {...props} />
      <FieldError>{errors[name]?.message}</FieldError>
    </div>
  );

  return (
    <>
      <SEO title="Create your restaurant - ServeKaro" description="Set up QR ordering, KOTs and GST billing for your restaurant in minutes." url="https://servekaro.com/signup" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-3">
        <div className="max-w-lg mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3"><ChefHat className="h-7 w-7 text-white" /></div>
            <h1 className="text-3xl font-bold text-gray-900">Start with ServeKaro</h1>
            <p className="text-gray-600 mt-1">QR ordering, KOTs and GST billing in one place</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            {['Restaurant', 'Your account'].map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i <= step ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border'}`}>
                  {i < step ? <CheckCircle className="h-5 w-5" /> : i + 1}
                </div>
                <span className={`text-sm ${i === step ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{t}</span>
                {i === 0 && <div className="w-10 h-px bg-gray-300" />}
              </div>
            ))}
          </div>

          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {step === 0 ? <><Building2 className="h-5 w-5 text-blue-600" /> About your restaurant</> : <><User className="h-5 w-5 text-blue-600" /> Owner account</>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {step === 0 ? (
                    <>
                      {field('restaurantName', 'Restaurant / brand name', { placeholder: 'Spice Route', autoFocus: true })}
                      {field('outletName', 'Outlet name', { placeholder: 'Spice Route – SG Highway' })}
                      {field('city', 'City', { placeholder: 'Ahmedabad' })}
                      <Button type="button" className="w-full" onClick={next}>Continue</Button>
                    </>
                  ) : (
                    <>
                      {field('ownerName', 'Your name', { autoFocus: true, autoComplete: 'name' })}
                      {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
                      {field('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel', placeholder: '98765 43210' })}
                      {field('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
                      {field('confirm', 'Confirm password', { type: 'password', autoComplete: 'new-password' })}
                      <FormError>{formError}</FormError>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create restaurant
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <Link to="/admin/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RestaurantSignUp;
