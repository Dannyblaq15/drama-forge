import { ConsoleLayout } from '@/components/layout/ConsoleLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ConsoleLayout>{children}</ConsoleLayout>
    </ProtectedRoute>
  );
}
