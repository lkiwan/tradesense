import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext(null)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation()

  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'fr'
  })

  const [isRTL, setIsRTL] = useState(language === 'ar')

  useEffect(() => {
    // Update i18next language
    i18n.changeLanguage(language)

    // Update localStorage
    localStorage.setItem('language', language)

    // Update RTL state
    const rtl = language === 'ar'
    setIsRTL(rtl)

    // Update document direction
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language, i18n])

  const setLanguage = (lang) => {
    if (['fr', 'en', 'ar'].includes(lang)) {
      setLanguageState(lang)
    }
  }

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' }
  ]

  const value = {
    language,
    setLanguage,
    isRTL,
    languages
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
