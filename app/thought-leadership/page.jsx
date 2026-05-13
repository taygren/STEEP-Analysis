import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Thought Leadership | STINT Studio',
  description: 'Strategic intelligence briefs — macro, geopolitical & sector analysis from STINT Studio.',
};

export default function ThoughtLeadershipListPage() {
  redirect('/?tab=thoughtleadership');
}
