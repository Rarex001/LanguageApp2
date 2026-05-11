'use client'

import { useState, useEffect, useRef } from 'react'
import styles from './VocabApp.module.css'

interface WordEntry {
  french: string
  english: string
  addedAt: number
}

interface TranslationResult {
  translation: string
  wordTranslations: Record<string, string>
  original: string
}

export default function VocabApp() {
  const [tab, setTab] = useState<'translate' | 'bank' | 'browse'>('translate')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wordBank, setWordBank] = useState<WordEntry[]>([])
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set())
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('french-vocab-bank')
    if (saved) {
      const bank: WordEntry[] = JSON.parse(saved)
      setWordBank(bank)
      setAddedWords(new Set(bank.map(w => w.french.toLowerCase())))
    }
  }, [])

  const saveToStorage = (bank: WordEntry[]) => {
    localStorage.setItem('french-vocab-bank', JSON.stringify(bank))
  }

  const handleTranslate = async () => {
    const text = input.trim()
    if (!text) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/translate?word=${encodeURIComponent(text)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch {
      setError('Translation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleTranslate()
  }

  const addWord = (french: string, english: string) => {
    const key = french.toLowerCase()
    if (addedWords.has(key)) return
    const entry: WordEntry = { french, english, addedAt: Date.now() }
    const newBank = [...wordBank, entry]
    setWordBank(newBank)
    setAddedWords(new Set([...addedWords, key]))
    saveToStorage(newBank)
  }

  const removeWord = (french: string) => {
    const newBank = wordBank.filter(w => w.french !== french)
    const newAdded = new Set(addedWords)
    newAdded.delete(french.toLowerCase())
    setWordBank(newBank)
    setAddedWords(newAdded)
    saveToStorage(newBank)
  }

  const handleWordHover = (e: React.MouseEvent, word: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
    setHoveredWord(word)
  }

  const getWordTranslation = (word: string): string | null => {
    if (!result) return null
    const clean = word.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '')
    return result.wordTranslations[clean] || null
  }

  const isWordSaved = (word: string) => {
    const clean = word.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '')
    return addedWords.has(clean)
  }

  const renderHighlightedText = () => {
    if (!result) return null
    const words = result.original.split(/(\s+|[,\.!?;:])/)
    return words.map((token, i) => {
      const isSpace = /^\s+$/.test(token)
      const isPunct = /^[,\.!?;:]$/.test(token)
      if (isSpace) return <span key={i}>{token}</span>
      if (isPunct) return <span key={i} style={{ color: 'var(--text-faint)' }}>{token}</span>
      const clean = token.replace(/[^a-zA-ZÀ-ÿ'-]/g, '')
      const trans = result.wordTranslations[clean.toLowerCase()]
      const saved = isWordSaved(token)
      return (
        <span
          key={i}
          className={`${styles.highlightWord} ${saved ? styles.saved : ''}`}
          onMouseEnter={e => handleWordHover(e, token)}
          onMouseLeave={() => setHoveredWord(null)}
          onClick={() => {
            if (trans && clean) {
              if (saved) removeWord(clean)
              else addWord(clean, trans)
            }
          }}
          title={trans || ''}
        >
          {token}
          {hoveredWord === token && trans && (
            <span className={styles.inlineTooltip}>{trans}</span>
          )}
        </span>
      )
    })
  }

  const grouped = wordBank.reduce<Record<string, WordEntry[]>>((acc, w) => {
    const l = w.french[0].toUpperCase()
    if (!acc[l]) acc[l] = []
    acc[l].push(w)
    return acc
  }, {})
  const letters = Object.keys(grouped).sort()

  const pct = Math.min(100, Math.round((wordBank.length / 3000) * 100))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoFlag}>🇫🇷</span>
            <span className={styles.logoText}>French Vocab</span>
          </div>
          <nav className={styles.nav}>
            {(['translate', 'bank', 'browse'] as const).map(t => (
              <button
                key={t}
                className={`${styles.navBtn} ${tab === t ? styles.navActive : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'translate' ? 'Translate' : t === 'bank' ? 'Word bank' : 'Browse A–Z'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={styles.main}>

        {tab === 'translate' && (
          <div className={styles.translateLayout}>
            <div className={styles.panel}>
              <div className={styles.panelLabel}>French</div>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a French word or sentence…"
                rows={5}
              />
              <div className={styles.panelFooter}>
                <span className={styles.hint}>⌘ Enter to translate</span>
                <button
                  className={styles.translateBtn}
                  onClick={handleTranslate}
                  disabled={loading || !input.trim()}
                >
                  {loading ? 'Translating…' : 'Translate →'}
                </button>
              </div>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelLabel}>English</div>
              {!result && !loading && !error && (
                <div className={styles.placeholder}>Translation will appear here</div>
              )}
              {loading && <div className={styles.placeholder}>Translating…</div>}
              {error && <div className={styles.errorMsg}>{error}</div>}
              {result && (
                <>
                  <div className={styles.translationMain}>{result.translation}</div>
                  <div className={styles.divider} />
                  <div className={styles.highlightLabel}>
                    Click any French word to add or remove it from your word bank
                  </div>
                  <div className={styles.highlighted}>
                    {renderHighlightedText()}
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendDot} style={{ background: 'var(--teal)' }} />
                    <span className={styles.legendText}>saved to bank</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'bank' && (
          <div>
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statNum}>{wordBank.length}</div>
                <div className={styles.statLabel}>Words saved</div>
              </div>
              <div className={styles.statCard} style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className={styles.statLabel}>Progress toward 3,000 common French words</div>
                  <div className={styles.statNum} style={{ fontSize: 16 }}>{pct}%</div>
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {wordBank.length === 0 ? (
              <div className={styles.empty}>
                No words yet — go to Translate, enter a sentence, and click words to save them.
              </div>
            ) : (
              <div className={styles.wordList}>
                {[...wordBank].sort((a, b) => a.french.localeCompare(b.french)).map(w => (
                  <div key={w.french} className={styles.wordRow}>
                    <span className={styles.wordFr}>{w.french}</span>
                    <span className={styles.wordEn}>{w.english}</span>
                    <button className={styles.removeBtn} onClick={() => removeWord(w.french)} aria-label="Remove">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'browse' && (
          <div>
            {wordBank.length === 0 ? (
              <div className={styles.empty}>
                Your word bank is empty — save some words first!
              </div>
            ) : (
              letters.map(letter => (
                <div key={letter} className={styles.letterGroup}>
                  <div className={styles.letterHeader}>{letter}</div>
                  <div className={styles.pillsWrap}>
                    {grouped[letter].sort((a, b) => a.french.localeCompare(b.french)).map(w => (
                      <div key={w.french} className={styles.pill}>
                        <span className={styles.pillWord}>{w.french}</span>
                        <span className={styles.pillTooltip}>{w.english}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
