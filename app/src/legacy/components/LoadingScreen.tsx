import { Zap } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="bg-primary/20 rounded-full p-6 inline-block mb-4 animate-pulse">
          <Zap className="h-12 w-12 text-primary" />
        </div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};
