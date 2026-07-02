import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setLocale, type Locale } from '@/features/ui/uiSlice'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'tj', label: 'Тоҷикӣ' },
]

export function LangSwitcher() {
  const { i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const locale = useAppSelector((state) => state.ui.locale)

  const handleSelect = (value: Locale) => {
    dispatch(setLocale(value))
    void i18n.changeLanguage(value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Change language">
            <Languages className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LOCALES.map((item) => (
          <DropdownMenuItem
            key={item.value}
            data-selected={item.value === locale}
            onClick={() => handleSelect(item.value)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
