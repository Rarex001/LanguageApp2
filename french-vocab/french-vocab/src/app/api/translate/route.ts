import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const word = req.nextUrl.searchParams.get('word')
  if (!word) return NextResponse.json({ error: 'No word provided' }, { status: 400 })

  try {
    // Translate the full text fr->en
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=fr|en`
    )
    const data = await res.json()
    const translation = data.responseData?.translatedText || ''

    // Also split into individual word translations for hover
    const words = word.trim().split(/\s+/)
    const wordTranslations: Record<string, string> = {}

    if (words.length > 1) {
      await Promise.all(
        words.map(async (w) => {
          const clean = w.replace(/[^a-zA-ZÀ-ÿ'-]/g, '')
          if (!clean) return
          try {
            const r = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=fr|en`
            )
            const d = await r.json()
            wordTranslations[clean.toLowerCase()] = d.responseData?.translatedText || clean
          } catch {
            wordTranslations[clean.toLowerCase()] = clean
          }
        })
      )
    } else {
      wordTranslations[word.toLowerCase().replace(/[^a-zA-ZÀ-ÿ'-]/g, '')] = translation
    }

    return NextResponse.json({ translation, wordTranslations, original: word })
  } catch (e) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
