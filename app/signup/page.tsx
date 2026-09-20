import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Create your account · Ringgy AI',
  description: 'Set up your AI receptionist in a few minutes.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      <OnboardingWizard />
    </div>
  );
}
