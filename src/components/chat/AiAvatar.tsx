interface AiAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
} as const

export default function AiAvatar({ size = 'sm', className = '' }: AiAvatarProps) {
  return (
    <img
      src="/ai-avatar.jpeg"
      alt="Váu Váu"
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
    />
  )
}
