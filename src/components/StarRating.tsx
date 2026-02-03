import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  readOnly = false,
  onChange,
  showValue = false,
  className,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (index: number) => {
    if (!readOnly && onChange) {
      onChange(index + 1);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(null);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const isFilled = index < displayRating;
          const isHalfFilled = !isFilled && index < displayRating + 0.5;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={cn(
                "relative transition-transform",
                !readOnly && "hover:scale-110 cursor-pointer",
                readOnly && "cursor-default"
              )}
              aria-label={`Rate ${index + 1} out of ${maxRating}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-150",
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-300 dark:text-gray-600"
                )}
              />
              {/* Half star overlay for read-only fractional ratings */}
              {readOnly && isHalfFilled && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "fill-yellow-400 text-yellow-400"
                    )}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Compact display version for cards
interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  count,
  size = "sm",
  className,
}) => {
  if (!rating && !count) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          "fill-yellow-400 text-yellow-400"
        )}
      />
      <span
        className={cn(
          "font-medium",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {rating > 0 ? rating.toFixed(1) : "—"}
      </span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "text-muted-foreground",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          ({count})
        </span>
      )}
    </div>
  );
};

export default StarRating;
