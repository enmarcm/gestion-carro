import {
  ArrowDownUp, BatteryCharging, CircleDot, Cog, Disc3, Droplets, Filter, Flame, Fuel, Link2, OctagonAlert,
  PlugZap, Snowflake, Thermometer, Wrench, Zap, Car, Gauge, Hammer, Bolt, Tag, Droplet, type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  ArrowDownUp, BatteryCharging, CircleDot, Cog, Disc3, Droplets, Filter, Flame, Fuel, Link2, OctagonAlert,
  PlugZap, Snowflake, Thermometer, Wrench, Zap, Car, Gauge, Hammer, Bolt, Tag, Droplet,
}
export const ICON_CHOICES = ['Wrench', 'Hammer', 'Bolt', 'Cog', 'Zap', 'Droplet', 'Tag', 'Car', 'Gauge', 'Flame']

export function CatIcon({ name, size = 22, className }: { name: string; size?: number; className?: string }) {
  const I = ICONS[name] ?? Wrench
  return <I size={size} strokeWidth={2.1} className={className} />
}
