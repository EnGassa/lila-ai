'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft } from 'lucide-react';

import { SelectionButton } from '@/components/ui/selection-button';
import { SectionHeader } from '@/components/ui/section-header';

// --- Theme Constants ---
const THEME = {
  bg: 'bg-[#F2F0E9]', // Beige background
  text: 'text-[#4A4238]', // Dark brown text
  accent: 'bg-[#C8A28E]', // Muted terra-cotta/mauve for active states
  accentText: 'text-white',
  buttonBase: 'bg-[#E6E2D6] hover:bg-[#DED9CC] text-[#4A4238] border-[#D6CDBF]',
  buttonActive: 'bg-[#C8A28E] hover:bg-[#B6907D] text-white border-[#C8A28E]',
  sectionDivider: 'border-[#D6CDBF]',
};

// --- Validation Schema ---
const intakeSchema = z.object({
  age: z.coerce.number().min(10).max(100),
  gender: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  skin_conditions: z.array(z.string()).optional(),
  sleep_hours: z.string().optional(),
  stress_level: z.coerce.number().min(0).max(10).optional(),
  hormonal_status: z.array(z.string()).optional(),
  medication: z.string().optional(),
  allergies: z.string().optional(),
  pregnancy_status: z.string().optional(),
  makeup_frequency: z.string().optional(),
  smoking: z.string().optional(),
  daily_routine_frequency: z.string().optional(),
  current_routine: z.object({
    cleanser: z.string().optional(),
    actives: z.string().optional(),
    sunscreen: z.string().optional(),
    moisturizer: z.string().optional(),
    eye_cream: z.string().optional(),
  }).optional(),
  budget: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

export default function IntakePageClient({ userId, initialData }: { userId: string, initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      age: initialData?.age,
      gender: initialData?.gender,
      city: initialData?.city,
      skin_conditions: initialData?.skin_conditions || [],
      sleep_hours: initialData?.sleep_hours,
      stress_level: initialData?.stress_level ?? 5,
      hormonal_status: initialData?.hormonal_status?.selected || [], // Unpack JSON object
      medication: initialData?.medication,
      allergies: initialData?.allergies,
      pregnancy_status: initialData?.pregnancy_status,
      makeup_frequency: initialData?.makeup_frequency,
      smoking: initialData?.smoking,
      daily_routine_frequency: initialData?.daily_routine_frequency,
      current_routine: initialData?.current_routine || {},
      budget: initialData?.budget,
    },
  });

  const onSubmit = async (data: IntakeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: userId,
        ...data,
        hormonal_status: data.hormonal_status ? { selected: data.hormonal_status } : null,
        current_routine: data.current_routine,
        updated_at: new Date().toISOString(), // Ensure updated_at is set
      };

      // Use upsert to update if exists (based on user_id uniqueness) or insert if new
      const { error } = await supabase.from('intake_submissions').upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;

      // Fire-and-forget Discord Notification
      fetch('/api/webhooks/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'intake',
            user_id: userId,
            data: data
        })
      }).catch(err => console.error('Failed to send Discord notification:', err));

      toast.success('Skin profile updated!');
      router.push(`/${userId}/upload`);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className={cn("min-h-screen font-sans selection:bg-[#C8A28E] selection:text-white", THEME.bg, THEME.text)}>
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 p-4 bg-[#F2F0E9]/90 backdrop-blur-md z-20 border-b border-[#D6CDBF]/30">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-black/5 -ml-2">
                <ChevronLeft className="w-6 h-6" />
             </Button>
             <h1 className="text-lg font-medium tracking-wide">Your Skin Profile</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-28 pb-32">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
                
                {/* SECTION 1: BASICS */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SectionHeader title="About You" subtitle="Understanding your background" />
                    
                    <div className="space-y-10">
                        <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xl font-medium block">What is your biological sex?</label>
                                        <p className="text-sm opacity-60 mt-1">
                                            We ask this to analyze hormonal patterns and skin thickness for better recommendation accuracy.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {["Female", "Male"].map(opt => (
                                            <SelectionButton 
                                                key={opt}
                                                label={opt}
                                                selected={field.value === opt}
                                                onClick={() => field.onChange(opt)}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">How old are you?</label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 28"
                                        className="h-16 text-2xl px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">Where do you live?</label>
                                    <Input 
                                        placeholder="e.g. New Delhi"
                                        className="h-16 text-lg px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                    <FormMessage />
                                </div>
                            )}
                        />
                    </div>
                </section>


                {/* SECTION 2: LIFESTYLE */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <SectionHeader title="Lifestyle & Health" subtitle="Context for your skin health" />

                    <div className="space-y-10">
                        <FormField
                            control={form.control}
                            name="skin_conditions"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">Do you have any diagnosed skin conditions?</label>
                                    <Input 
                                        placeholder="e.g. Eczema, Rosacea (Optional)"
                                        className="h-16 text-lg px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                        {...field}
                                        value={field.value?.join(', ') ?? ''}
                                        onChange={e => field.onChange(e.target.value ? e.target.value.split(',').map(s => s.trim()) : [])}
                                    />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="medication"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">Are you taking any medication?</label>
                                    <Input 
                                        placeholder="e.g. Oral Contraceptives, Accutane (Optional)"
                                        className="h-16 text-lg px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="allergies"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">Do you have any allergies?</label>
                                    <Input 
                                        placeholder="e.g. Aspirin, Sulfa drugs (Optional)"
                                        className="h-16 text-lg px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sleep_hours"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">How much sleep do you get?</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {["Less than 6 hours", "6-7 hours", "7-8 hours", "8+ hours"].map(opt => (
                                            <SelectionButton 
                                                key={opt}
                                                label={opt}
                                                selected={field.value === opt}
                                                onClick={() => field.onChange(opt)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="stress_level"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">What is your typical stress level? (0-10)</label>
                                    <div className="bg-[#E6E2D6] p-6 rounded-xl border border-[#D6CDBF]">
                                        <div className="flex justify-between mb-4 text-xl font-medium">
                                            <span>Low</span>
                                            <span>{field.value}</span>
                                            <span>High</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="10" 
                                            value={field.value ?? 5} 
                                            onChange={e => field.onChange(parseInt(e.target.value))}
                                            className="w-full h-3 bg-[#D6CDBF] rounded-lg appearance-none cursor-pointer accent-[#C8A28E]"
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </section>

                 {/* SECTION 3: HABITS */}
                 <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <SectionHeader title="Habits" />
                    
                    <div className="space-y-10">
                        {form.watch("gender") !== "Male" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="hormonal_status"
                                    render={({ field }) => (
                                        <div className="space-y-4">
                                            <label className="text-xl font-medium">Hormonal Health</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {["Regular periods", "Irregular periods", "PCOD/PCOS", "None / Not Applicable"].map(opt => {
                                                    const isSelected = field.value?.includes(opt);
                                                    return (
                                                        <SelectionButton 
                                                            key={opt}
                                                            label={opt}
                                                            selected={!!isSelected}
                                                            onClick={() => {
                                                                const current = field.value || [];
                                                                if (isSelected) field.onChange(current.filter(x => x !== opt));
                                                                else field.onChange([...current, opt]);
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="pregnancy_status"
                                    render={({ field }) => (
                                        <div className="space-y-4">
                                            <label className="text-xl font-medium">Pregnancy / Breastfeeding</label>
                                            <div className="flex flex-col gap-2">
                                                {["Pregnant", "Breastfeeding", "Trying to Conceive", "None"].map(opt => (
                                                    <SelectionButton 
                                                        key={opt}
                                                        label={opt}
                                                        selected={field.value === opt}
                                                        onClick={() => field.onChange(opt)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                />
                            </>
                         )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="smoking"
                                render={({ field }) => (
                                    <div className="space-y-4">
                                        <label className="text-xl font-medium">Do you smoke?</label>
                                        <div className="flex flex-col gap-2">
                                            {["No", "Occasionally", "Regularly"].map(opt => (
                                                <SelectionButton 
                                                    key={opt}
                                                    label={opt}
                                                    selected={field.value === opt}
                                                    onClick={() => field.onChange(opt)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            />
                             {form.watch("gender") !== "Male" && (
                                 <FormField
                                    control={form.control}
                                    name="makeup_frequency"
                                    render={({ field }) => (
                                        <div className="space-y-4">
                                            <label className="text-xl font-medium">How often do you wear makeup?</label>
                                            <div className="flex flex-col gap-2">
                                                {["Daily", "Often", "Occasionally", "Never"].map(opt => (
                                                    <SelectionButton 
                                                        key={opt}
                                                        label={opt}
                                                        selected={field.value === opt}
                                                        onClick={() => field.onChange(opt)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                />
                             )}
                        </div>
                    </div>
                 </section>

                 {/* SECTION 4: ROUTINE & BUDGET */}
                 <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <SectionHeader title="Routine & Budget" />

                    <div className="space-y-10">
                        <FormField
                            control={form.control}
                            name="daily_routine_frequency"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">How consistent is your routine?</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {["Twice daily", "Once daily", "Ad Hoc / Sometimes", "Rarely / Never"].map(opt => (
                                            <SelectionButton 
                                                key={opt}
                                                label={opt}
                                                selected={field.value === opt}
                                                onClick={() => field.onChange(opt)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        />

                        <div className="space-y-4">
                            <label className="text-xl font-medium">What are you currently using? (Optional)</label>
                            <div className="space-y-3">
                                {[
                                    { id: 'cleanser', label: 'Cleanser' },
                                    { id: 'actives', label: 'Serums / Treatments (e.g. Retinol, Vit C)' },
                                    { id: 'moisturizer', label: 'Moisturizer' },
                                    { id: 'sunscreen', label: 'Sunscreen' },
                                ].map(item => (
                                    <FormField
                                        key={item.id}
                                        control={form.control}
                                        // @ts-ignore
                                        name={`current_routine.${item.id}`}
                                        render={({ field }) => (
                                            <Input 
                                                placeholder={item.label}
                                                className="h-14 text-lg px-6 rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]"
                                                {...field}
                                                value={typeof field.value === 'string' ? field.value : ''}
                                            />
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                         <FormField
                            control={form.control}
                            name="budget"
                            render={({ field }) => (
                                <div className="space-y-4">
                                    <label className="text-xl font-medium">What is your monthly skincare budget?</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Under ₹1000", "₹1000 - ₹2500", "₹2500 - ₹5000", "₹5000+"].map(opt => (
                                            <SelectionButton 
                                                key={opt}
                                                label={opt}
                                                selected={field.value === opt}
                                                onClick={() => field.onChange(opt)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                 </section>


                <div className="pt-8">
                        <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "w-full h-16 text-xl rounded-xl shadow-lg transition-all",
                            THEME.accent, 
                            THEME.accentText,
                            "hover:bg-[#B6907D] hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Profile'}
                        {!isSubmitting && <Check className="ml-2 w-5 h-5" />}
                        </Button>
                </div>

            </form>
        </Form>
      </div>
    </div>
  );
}
