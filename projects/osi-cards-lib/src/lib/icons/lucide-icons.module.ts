import { NgModule, Provider } from '@angular/core';
import {
  LucideAngularModule,
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Award,
  Box,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Calculator,
  ExternalLink,
  Facebook,
  DollarSign,
  Download,
  FileText,
  Folder,
  Globe,
  GitBranch,
  Grid,
  Handshake,
  Hash,
  HelpCircle,
  Info,
  Instagram,
  Linkedin,
  Lightbulb,
  List,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  Minus,
  Package,
  Phone,
  PieChart,
  Quote,
  RefreshCw,
  Share2,
  ShoppingCart,
  Save,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Star,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Twitter,
  Users,
  UserCheck,
  User,
  Video,
  Type,
  Wrench,
  XCircle,
  Zap,
  // Provider token and class
  LUCIDE_ICONS,
  LucideIconProvider
} from 'lucide-angular';

const ICONS = {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Award,
  Box,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Calculator,
  ExternalLink,
  Facebook,
  DollarSign,
  Download,
  FileText,
  Folder,
  Globe,
  GitBranch,
  Grid,
  Handshake,
  Hash,
  HelpCircle,
  Info,
  Instagram,
  Linkedin,
  Lightbulb,
  List,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  Minus,
  Package,
  Phone,
  PieChart,
  Quote,
  RefreshCw,
  Share2,
  ShoppingCart,
  Save,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Star,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Twitter,
  Users,
  UserCheck,
  User,
  Video,
  Type,
  Wrench,
  XCircle,
  Zap
};

@NgModule({
  imports: [LucideAngularModule.pick(ICONS)],
  exports: [LucideAngularModule]
})
export class LucideIconsModule {}

/**
 * Provide Lucide icons for OSI Cards library
 * This is used by provideOSICards() to register icons at the application level
 */
export function provideLucideIcons(): Provider[] {
  return [
    { provide: LUCIDE_ICONS, useFactory: () => new LucideIconProvider(ICONS) }
  ];
}

/**
 * Export the ICONS object for direct use
 */
export { ICONS as OSI_CARDS_ICONS };
















