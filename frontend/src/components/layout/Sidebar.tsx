import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Megaphone,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vendas', href: '/sales', icon: ShoppingCart },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'Produtos', href: '/products', icon: Package },
  { name: 'Marketing', href: '/marketing', icon: Megaphone },
  { name: 'Predições', href: '/predictions', icon: Brain },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-700 z-40',
        'flex flex-col transition-all duration-300'
      )}
      animate={{ width: collapsed ? 72 : 240 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-700">
        <motion.div
          className="flex items-center gap-3"
          animate={{ opacity: collapsed ? 0 : 1 }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-white">Cortex</span>
          )}
        </motion.div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-dark-700 group',
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-white'
                  )}
                />
                {!collapsed && (
                  <motion.span
                    className="text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {item.name}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-dark-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'hover:bg-dark-700 group',
              isActive
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-dark-400 hover:text-white'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Configurações</span>
          )}
        </NavLink>
      </div>

      {/* Client info */}
      {!collapsed && (
        <motion.div
          className="p-4 mx-3 mb-3 bg-dark-800 rounded-lg border border-dark-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-xs text-dark-500 mb-1">Cliente</p>
          <p className="text-sm font-medium text-white">Demo Store</p>
          <p className="text-xs text-dark-400">Plano: Enterprise</p>
        </motion.div>
      )}
    </motion.aside>
  );
}
