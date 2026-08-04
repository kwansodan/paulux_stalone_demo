import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label: string;
  href: string;
  className?: string;
}

export const BackButton = ({ label, href, className = "" }: BackButtonProps) => {
  return (
    <Link 
      href={href} 
      className={`group flex items-center gap-2 w-fit text-slate-600 hover:text-slate-900 transition-colors duration-200 ${className}`}
    >
      <ArrowLeft 
        size={20} 
        strokeWidth={1.5} 
        className="transition-transform group-hover:-translate-x-1" 
      />
      <span className="text-lg font-medium tracking-tight">
        {label}
      </span>
    </Link>
  );
};