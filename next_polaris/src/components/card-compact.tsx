// components/card-compact.tsx
import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Separator } from './ui/separator';

interface CardCompactProps {
  title: string;
  description?: string;
  content: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  headerIcon?: React.ReactNode;
  showSeparator?: boolean
}

const CardCompact = ({ title, description, content, footer, className, headerIcon, showSeparator=true }: CardCompactProps) => {
  return (
    <Card className={className}>
      <CardHeader className="text-center space-y-4">
        {headerIcon && (
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              {headerIcon}
            </div>
          </div>
        )}
        <div className="flex flex-col">
          {title && <CardTitle className="text-3xl font-medium text-gray-900">{title}</CardTitle>}
          {description && <CardDescription className="text-base text-gray-600">{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="px-8">
        {showSeparator && <Separator className="w-full mt-2 mb-4" />}
        {content}
      </CardContent>
      {footer && (
        <CardFooter className="flex justify-start">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

export { CardCompact }