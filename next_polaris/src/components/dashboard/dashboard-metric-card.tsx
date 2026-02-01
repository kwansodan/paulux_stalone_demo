import { cn } from "@/lib/utils";
import React from "react"

type MetricCardProps = {
  icon?: React.ReactElement<{ className: string }>;
  iconClassName?: string;
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function MetricCard({
  icon,
  iconClassName,
  title,
  value,
  subtitle
}: MetricCardProps) {
  return (
    <div className="flex flex-col rounded-xl border p-5 bg-white">
      {icon && (
        <div className={cn(
          "w-8 h-8 p-2 items-center justify-center rounded-full",
          iconClassName
        )}>
        {
          React.cloneElement(icon, {
            className: cn(
              "w-4 h-4 flex-shrink-0",
            )
          })
        }
        </div>
      )}
      <h3 className="text-[30px] font-medium ">{value}</h3>
      <p className="text-[18px] text-gray-900 ">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}
