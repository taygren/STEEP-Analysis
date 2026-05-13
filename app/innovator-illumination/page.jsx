import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Innovator Illumination | STINT Studio',
  description: 'Deep-dive profiles on emerging technology innovators shaping the next wave of enterprise infrastructure.',
};

export default function InnovatorIlluminationListPage() {
  redirect('/?tab=innovatorillumination');
}
