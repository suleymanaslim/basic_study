import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className="glass-card border-0 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {Icon && (
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color]}`}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
