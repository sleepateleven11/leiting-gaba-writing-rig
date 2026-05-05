declare module "lucide-react" {
  import type * as React from "react";

  export type LucideIcon = React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> &
      React.RefAttributes<SVGSVGElement> & {
        size?: string | number;
        absoluteStrokeWidth?: boolean;
      }
  >;

  export const AlertTriangle: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const Bolt: LucideIcon;
  export const Book: LucideIcon;
  export const BookOpenText: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Bot: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CheckSquare2: LucideIcon;
  export const CircleDashed: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const ClipboardPlus: LucideIcon;
  export const Clock3: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const FileText: LucideIcon;
  export const Info: LucideIcon;
  export const Layers3: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Link2: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const MessageSquareText: LucideIcon;
  export const Newspaper: LucideIcon;
  export const Pencil: LucideIcon;
  export const PencilLine: LucideIcon;
  export const PenLine: LucideIcon;
  export const Pin: LucideIcon;
  export const Plus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Save: LucideIcon;
  export const Send: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const Target: LucideIcon;
  export const Trash2: LucideIcon;
  export const Unlock: LucideIcon;
  export const UserRound: LucideIcon;
  export const Wand2: LucideIcon;
  export const X: LucideIcon;
}
