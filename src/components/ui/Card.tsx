// src/components/ui/Card.tsx
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
  hover?: boolean
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({ padding = 'md', hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'card-clay',
        paddingClasses[padding],
        hover ? 'cursor-pointer hover:shadow-clay transition-shadow duration-150' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-base font-medium text-primary ${className}`}>
      {children}
    </h3>
  )
}
