import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/routes";

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
