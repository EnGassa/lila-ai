'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@lila/ui';
import { Button as ThemeButton } from '@radix-ui/themes';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MessageSquarePlus, X } from 'lucide-react';
import { SelectionButton } from '@/components/ui/selection-button';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

// --- Theme Constants (matching Intake form) ---
const THEME = {
    bg: 'bg-[#F2F0E9]',
    text: 'text-[#4A4238]',
    accent: 'bg-[#C8A28E]',
    accentText: 'text-white',
    inputBase: 'rounded-xl border-[#D6CDBF] bg-[#E6E2D6] focus:border-[#C8A28E] focus:ring-[#C8A28E]',
};

const feedbackSchema = z.object({
    helpfulness_score: z.number().min(0).max(10),
    accuracy_score: z.number().min(0).max(10),
    qualitative_feedback: z.string().optional(),
    clarity_score: z.number().min(0).max(10),
    explanation_quality: z.string().optional(),
    trust_score: z.number().min(0).max(10),
    personalization_suggestions: z.string().optional(),
    ux_score: z.number().min(0).max(10),
    improvement_suggestions: z.string().optional(),
    subscription_interest: z.string().optional(),
    subscription_features: z.array(z.string()).optional(),
    willingness_to_pay_sub: z.string().optional(),
    willingness_to_pay_one_time: z.string().optional(),
    derm_consult_interest: z.string().optional(),
    interview_willingness: z.boolean().default(false),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
    userId: string;
    recommendationId?: string;
}

export function FeedbackModal({ userId, recommendationId }: FeedbackModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            helpfulness_score: 5,
            accuracy_score: 5,
            clarity_score: 5,
            trust_score: 5,
            ux_score: 5,
            qualitative_feedback: '',
            subscription_features: [],
            interview_willingness: false,
        },
    });

    const subscriptionFeatures = [
        "Progress photos and timelines",
        "Daily routine checklist + reminders",
        "Automatic updates to routine",
        "Chat support",
        "Regular skin review with specialist",
        "Discounts on products"
    ];

    async function onSubmit(data: FeedbackFormValues) {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('feedback_submissions').insert({
                user_id: userId,
                recommendation_id: recommendationId,
                ...data,
            });

            if (error) throw error;

            // Fire-and-forget Discord Notification
            fetch('/api/webhooks/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'feedback',
                    user_id: userId,
                    data: { ...data, recommendation_id: recommendationId }
                })
            }).catch(err => console.error('Failed to send Discord notification:', err));

            toast.success('Thank you for your feedback!', {
                className: 'bg-[#F2F0E9] text-[#4A4238] border-[#D6CDBF]',
            });
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error('Feedback error:', error);
            toast.error('Failed to submit feedback.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const SliderField = ({ name, label }: { name: any; label: string }) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-lg font-medium">{label}</FormLabel>
                    <div className="bg-[#E6E2D6] p-6 rounded-xl border border-[#D6CDBF] mt-2">
                        <div className="flex justify-between mb-4 text-xl font-medium">
                            <span>Low</span>
                            <span>{field.value}</span>
                            <span>High</span>
                        </div>
                        <Slider
                            min={0}
                            max={10}
                            step={1}
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="[&_.relative]:bg-[#D6CDBF] [&_.absolute]:bg-[#C8A28E] [&_span]:border-[#C8A28E]"
                        />
                    </div>
                </FormItem>
            )}
        />
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <ThemeButton
                    className="w-full sm:w-auto sm:min-w-[300px] cursor-pointer gap-2"
                    size="3"
                    variant="solid"
                    color="blue"
                >
                    <MessageSquarePlus className="h-4 w-4" />
                    Share Feedback
                </ThemeButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 gap-0 bg-[#F2F0E9] border-[#D6CDBF] text-[#4A4238]">

                {/* Header */}
                <div className="p-6 border-b border-[#D6CDBF]/50 flex items-center justify-between bg-[#F2F0E9] rounded-t-lg z-10">
                    <div>
                        <DialogTitle className="text-2xl font-serif text-[#4A4238]">Your Feedback</DialogTitle>
                        <DialogDescription className="text-sm opacity-60 mt-1 text-[#4A4238]">Help us improve your experience</DialogDescription>
                    </div>
                    <DialogClose className="opacity-70 hover:opacity-100 transition-opacity">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 pb-12">

                            {/* Section 1: Analysis Quality */}
                            <section>
                                <SectionHeader title="Analysis Quality" />
                                <div className="space-y-8">
                                    <SliderField name="helpfulness_score" label="How helpful was the analysis?" />
                                    <SliderField name="accuracy_score" label="How accurate were the concerns?" />

                                    <FormField
                                        control={form.control}
                                        name="qualitative_feedback"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">What felt most/least useful?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Share your thoughts..."
                                                        className={cn("min-h-[100px] text-lg p-4", THEME.inputBase)}
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            {/* Section 2: Recommendations */}
                            <section>
                                <SectionHeader title="Recommendations" />
                                <div className="space-y-8">
                                    <SliderField name="clarity_score" label="Clarity of routine recommendation" />

                                    <FormField
                                        control={form.control}
                                        name="explanation_quality"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">The explanation of "Why" felt...</FormLabel>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                                    {["Too Simple", "Just Right", "Too Complex"].map(opt => (
                                                        <SelectionButton
                                                            key={opt}
                                                            label={opt}
                                                            selected={field.value === opt}
                                                            onClick={() => field.onChange(opt)}
                                                            className="justify-center"
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <SliderField name="trust_score" label="Trust in recommendations" />

                                    <FormField
                                        control={form.control}
                                        name="personalization_suggestions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">How could we make it feel more personalized?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="E.g. Alternatives, using existing products..."
                                                        className={cn("min-h-[100px] text-lg p-4", THEME.inputBase)}
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            {/* Section 3: Experience */}
                            <section>
                                <SectionHeader title="User Experience" />
                                <div className="space-y-8">
                                    <SliderField name="ux_score" label="Ease of navigation" />

                                    <FormField
                                        control={form.control}
                                        name="improvement_suggestions"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">Any features you'd like to see?</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Suggestions..."
                                                        className={cn("min-h-[100px] text-lg p-4", THEME.inputBase)}
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            {/* Section 4: Future & Subscriptions */}
                            <section>
                                <SectionHeader title="Future Features" subtitle="Help shape what we build next" />
                                <div className="space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="subscription_interest"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">Interest in monthly subscription?</FormLabel>
                                                <div className="grid grid-cols-1 gap-3 pt-2">
                                                    {["Very Interested", "Somewhat Interested", "Not Interested"].map(opt => (
                                                        <SelectionButton
                                                            key={opt}
                                                            label={opt}
                                                            selected={field.value === opt}
                                                            onClick={() => field.onChange(opt)}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="subscription_features"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-medium">What features matter most?</FormLabel>
                                                <div className="grid grid-cols-1 gap-3 pt-2">
                                                    {subscriptionFeatures.map((item) => (
                                                        <FormField
                                                            key={item}
                                                            control={form.control}
                                                            name="subscription_features"
                                                            render={({ field }) => {
                                                                const isSelected = field.value?.includes(item);
                                                                return (
                                                                    <SelectionButton
                                                                        label={item}
                                                                        selected={!!isSelected}
                                                                        onClick={() => {
                                                                            const value = field.value || [];
                                                                            if (isSelected) field.onChange(value.filter(v => v !== item));
                                                                            else field.onChange([...value, item]);
                                                                        }}
                                                                    />
                                                                );
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="willingness_to_pay_sub"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-medium">Preferred Monthly Price</FormLabel>
                                                    <div className="flex flex-col gap-2 pt-2">
                                                        {["< ₹400", "₹400 - ₹699", "₹700 - ₹999", "₹1000+"].map(opt => (
                                                            <SelectionButton
                                                                key={opt}
                                                                label={opt}
                                                                selected={field.value === opt}
                                                                onClick={() => field.onChange(opt)}
                                                                className="py-3 px-4 text-base"
                                                            />
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="willingness_to_pay_one_time"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-medium">Preferred One-time Price</FormLabel>
                                                    <div className="flex flex-col gap-2 pt-2">
                                                        {["< ₹400", "₹400 - ₹699", "₹700 - ₹999", "₹1000+"].map(opt => (
                                                            <SelectionButton
                                                                key={opt}
                                                                label={opt}
                                                                selected={field.value === opt}
                                                                onClick={() => field.onChange(opt)}
                                                                className="py-3 px-4 text-base"
                                                            />
                                                        ))}
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="interview_willingness"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="bg-[#E6E2D6] p-4 rounded-xl border border-[#D6CDBF] flex items-center justify-between cursor-pointer" onClick={() => field.onChange(!field.value)}>
                                                    <div>
                                                        <FormLabel className="text-lg font-medium cursor-pointer">User Interview</FormLabel>
                                                        <p className="text-sm opacity-60">Willing to do a 10-15m call?</p>
                                                    </div>
                                                    <div className={cn("w-6 h-6 rounded border border-[#4A4238] flex items-center justify-center transition-colors", field.value ? "bg-[#4A4238]" : "bg-transparent")}>
                                                        {field.value && <Check className="w-4 h-4 text-[#F2F0E9]" />}
                                                    </div>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            <div className="pt-4 sticky bottom-0 bg-[#F2F0E9] pb-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={cn(
                                        "w-full h-14 text-lg rounded-xl shadow-md transition-all",
                                        THEME.accent,
                                        THEME.accentText,
                                        "hover:bg-[#B6907D] hover:scale-[1.01] active:scale-[0.99]"
                                    )}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                            </div>

                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper icons
function Check({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}
