import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clipboard,
  Clock,
  Columns3,
  Edit,
  Eye,
  FileEdit,
  FolderOpen,
  Info,
  Keyboard,
  LayoutGrid,
  List,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  SendHorizontal,
  Settings,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import type { Priority, Status } from '@/types'

interface IconProps {
  className?: string
  size?: number
}

export function BacklogIcon({ className, size = 16 }: IconProps) {
  return <Clipboard className={className} width={size} height={size} />
}

export function PlanningIcon({ className, size = 16 }: IconProps) {
  return <Target className={className} width={size} height={size} />
}

export function TodoIcon({ className, size = 16 }: IconProps) {
  return <FileEdit className={className} width={size} height={size} />
}

export function InProgressIcon({ className, size = 16 }: IconProps) {
  return <RefreshCw className={className} width={size} height={size} />
}

export function ReviewIcon({ className, size = 16 }: IconProps) {
  return <Eye className={className} width={size} height={size} />
}

export function DoneIcon({ className, size = 16 }: IconProps) {
  return <CheckCircle2 className={className} width={size} height={size} />
}

export function AllIssuesIcon({ className, size = 16 }: IconProps) {
  return <LayoutGrid className={className} width={size} height={size} />
}

export function ProjectIcon({ className, size = 16 }: IconProps) {
  return <FolderOpen className={className} width={size} height={size} />
}

export function SettingsIcon({ className, size = 16 }: IconProps) {
  return <Settings className={className} width={size} height={size} />
}

export function AnalyticsIcon({ className, size = 16 }: IconProps) {
  return <BarChart3 className={className} width={size} height={size} />
}

export function SearchIcon({ className, size = 16 }: IconProps) {
  return <Search className={className} width={size} height={size} />
}

export function ListIcon({ className, size = 16 }: IconProps) {
  return <List className={className} width={size} height={size} />
}

export function BoardIcon({ className, size = 16 }: IconProps) {
  return <Columns3 className={className} width={size} height={size} />
}

export function AddIcon({ className, size = 16 }: IconProps) {
  return <Plus className={className} width={size} height={size} />
}

export function CloseIcon({ className, size = 16 }: IconProps) {
  return <X className={className} width={size} height={size} />
}

export function CalendarIcon({ className, size = 16 }: IconProps) {
  return <CalendarCheck className={className} width={size} height={size} />
}

export function ClockIcon({ className, size = 16 }: IconProps) {
  return <Clock className={className} width={size} height={size} />
}

export function CommentIcon({ className, size = 16 }: IconProps) {
  return <MessageSquare className={className} width={size} height={size} />
}

export function NotificationIcon({ className, size = 16 }: IconProps) {
  return <Bell className={className} width={size} height={size} />
}

export function DeleteIcon({ className, size = 16 }: IconProps) {
  return <Trash2 className={className} width={size} height={size} />
}

export function EditIcon({ className, size = 16 }: IconProps) {
  return <Edit className={className} width={size} height={size} />
}

export function CheckboxIcon({ className, size = 16 }: IconProps) {
  return <CheckSquare className={className} width={size} height={size} />
}

export function CheckIcon({ className, size = 16 }: IconProps) {
  return <Check className={className} width={size} height={size} />
}

export function WarningIcon({ className, size = 16 }: IconProps) {
  return <AlertCircle className={className} width={size} height={size} />
}

export function InfoIcon({ className, size = 16 }: IconProps) {
  return <Info className={className} width={size} height={size} />
}

export function MoonIcon({ className, size = 16 }: IconProps) {
  return <Moon className={className} width={size} height={size} />
}

export function FlashLightIcon({ className, size = 16 }: IconProps) {
  return <Zap className={className} width={size} height={size} />
}

export function SendIcon({ className, size = 16 }: IconProps) {
  return <SendHorizontal className={className} width={size} height={size} />
}

export function KeyboardIcon({ className, size = 16 }: IconProps) {
  return <Keyboard className={className} width={size} height={size} />
}

export function MenuIcon({ className, size = 16 }: IconProps) {
  return <Menu className={className} width={size} height={size} />
}

export function ArrowLeftIcon({ className, size = 16 }: IconProps) {
  return <ArrowLeft className={className} width={size} height={size} />
}

export function ArrowRightIcon({ className, size = 16 }: IconProps) {
  return <ArrowRight className={className} width={size} height={size} />
}

export function DotIcon({ className, size = 16 }: IconProps) {
  return <Circle className={className} width={size} height={size} />
}

export function RecurrenceIcon({ className, size = 16 }: IconProps) {
  return <Repeat className={className} width={size} height={size} />
}

export function StatusIcon({ status, className, size = 16 }: { status: Status } & IconProps) {
  switch (status) {
    case 'backlog':
      return <BacklogIcon className={className} size={size} />
    case 'planning':
      return <PlanningIcon className={className} size={size} />
    case 'todo':
      return <TodoIcon className={className} size={size} />
    case 'in_progress':
      return <InProgressIcon className={className} size={size} />
    case 'review':
      return <ReviewIcon className={className} size={size} />
    case 'done':
      return <DoneIcon className={className} size={size} />
    default:
      return <Clipboard className={className} width={size} height={size} />
  }
}

export function PriorityIcon({
  priority,
  className,
  size = 8,
}: { priority: Priority } & IconProps) {
  const colors: Record<Priority, string> = {
    high: 'text-orange-500',
    medium: 'text-indigo-500',
    low: 'text-gray-500',
  }
  return (
    <Circle
      className={`${colors[priority]} ${className} fill-current`}
      width={size}
      height={size}
    />
  )
}
