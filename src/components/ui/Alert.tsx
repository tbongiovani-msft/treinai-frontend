import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

const config = {
  info: { icon: Info, bg: 'bg-primary-50 border-primary-200', text: 'text-primary-800' },
  success: { icon: CheckCircle, bg: 'bg-accent-50 border-accent-200', text: 'text-accent-800' },
  warning: { icon: AlertCircle, bg: 'bg-warning-50 border-yellow-200', text: 'text-yellow-800' },
  error: { icon: XCircle, bg: 'bg-danger-50 border-red-200', text: 'text-danger-700' },
};

export function Alert({ type = 'info', title, message, className }: AlertProps) {
  const { icon: Icon, bg, text } = config[type];

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-4', bg, className)}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', text)} />
      <div>
        {title && <p className={cn('font-medium', text)}>{title}</p>}
        <p className={cn('text-sm', text)}>{message}</p>
      </div>
    </div>
  );
}
