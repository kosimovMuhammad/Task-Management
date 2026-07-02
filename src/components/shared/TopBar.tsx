import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Bell, HelpCircle, LogOut, Search, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LangSwitcher } from '@/components/shared/LangSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { logout } from '@/features/auth/authSlice'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopBar() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={t('nav.search')}
          disabled
          className="w-full rounded-md border border-input bg-transparent py-1.5 pl-8 pr-3 text-sm text-muted-foreground outline-none disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex items-center gap-1">
        <LangSwitcher />
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label={t('nav.notifications')}>
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={t('nav.help')}>
          <HelpCircle className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="ml-1 flex size-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="size-full object-cover" />
                ) : (
                  initials(user?.display_name ?? user?.email ?? '?')
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="truncate">{user?.display_name ?? user?.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/settings" />}>
                <SettingsIcon className="size-4" />
                {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void dispatch(logout())}>
                <LogOut className="size-4" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
