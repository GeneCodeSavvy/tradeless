interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`animate-spin w-12 h-12 ${className}`}>
      <div className="w-full h-full border-2 border-primary/20 border-t-primary rounded-full" />
    </div>
  );
};