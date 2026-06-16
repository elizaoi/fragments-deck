import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Folder = {
  id: string
  name: string
}

type CardSuit = 'речь' | 'жест' | 'пауза' | 'письмо' | 'взгляд'

type DeckCard = {
  id: string
  folderId: string
  title: string
  question: string
  backText: string
  suit: CardSuit
  x: number
  y: number
  flipped: boolean
}

type ArchiveState = {
  folders: Folder[]
  cards: DeckCard[]
  activeFolderId: string
  selectedCardId: string
}

const suits: CardSuit[] = ['речь', 'жест', 'пауза', 'письмо', 'взгляд']
const storageKey = 'fragments-archive-state-v4'

const baseFolders: Folder[] = [
  { id: 'folder-1', name: 'Фигуры речи' },
  { id: 'folder-2', name: 'Ожидание' },
  { id: 'folder-3', name: 'Разрыв' },
  { id: 'folder-4', name: 'Жесты' },
  { id: 'folder-5', name: 'Письма' },
]

const prompts = [
  'Что ты называешь близостью, когда говоришь о другом человеке?',
  'Какая фраза возвращает тебя в состояние ожидания?',
  'Что становится доказательством любви, хотя им не является?',
  'Как выглядит пауза, если записать ее как действие?',
  'Какая мысль повторяется слишком часто, чтобы быть случайной?',
]

function createInitialCards(): DeckCard[] {
  return baseFolders.flatMap((folder, folderIndex) =>
    Array.from({ length: 20 }, (_, index) => {
      const number = folderIndex * 20 + index + 1
      const column = index % 5
      const row = Math.floor(index / 5)

      return {
        id: `card-${number}`,
        folderId: folder.id,
        title: `Фигура ${String(number).padStart(2, '0')}`,
        question: prompts[index % prompts.length],
        backText: 'Здесь можно записать трактовку, пример, сцену или будущую механику карты.',
        suit: suits[number % suits.length],
        x: 64 + column * 190,
        y: 64 + row * 270,
        flipped: false,
      } satisfies DeckCard
    }),
  )
}

function createInitialArchive(): ArchiveState {
  const cards = createInitialCards()

  return {
    folders: baseFolders,
    cards,
    activeFolderId: baseFolders[0].id,
    selectedCardId: cards[0].id,
  }
}

function loadArchiveState(): ArchiveState {
  if (typeof window === 'undefined') return createInitialArchive()

  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return createInitialArchive()

    const parsed = JSON.parse(stored) as ArchiveState
    if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.cards)) {
      return createInitialArchive()
    }

    return parsed
  } catch {
    return createInitialArchive()
  }
}

function getFolderInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase('ru-RU') ?? '•'
}

function App() {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const initialArchive = useMemo(() => loadArchiveState(), [])
  const [folders, setFolders] = useState(initialArchive.folders)
  const [cards, setCards] = useState<DeckCard[]>(initialArchive.cards)
  const [activeFolderId, setActiveFolderId] = useState(initialArchive.activeFolderId)
  const [selectedCardId, setSelectedCardId] = useState(initialArchive.selectedCardId)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)

  const activeFolder = folders.find((folder) => folder.id === activeFolderId)
  const visibleCards = cards.filter((card) => card.folderId === activeFolderId)
  const selectedCard = cards.find((card) => card.id === selectedCardId)
  const cardCountByFolder = useMemo(
    () =>
      folders.reduce<Record<string, number>>((acc, folder) => {
        acc[folder.id] = cards.filter((card) => card.folderId === folder.id).length
        return acc
      }, {}),
    [cards, folders],
  )

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ folders, cards, activeFolderId, selectedCardId }),
    )
  }, [activeFolderId, cards, folders, selectedCardId])

  function updateCard(cardId: string, patch: Partial<DeckCard>) {
    setCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, ...patch } : card)),
    )
  }

  function addCard() {
    const nextNumber = cards.length + 1
    const newCard: DeckCard = {
      id: `card-${Date.now()}`,
      folderId: activeFolderId,
      title: `Новая карта ${nextNumber}`,
      question: 'Напиши вопрос или фрагмент, из которого будет собрана карта.',
      backText: 'Оборотная сторона для заметки, правила или расшифровки.',
      suit: suits[nextNumber % suits.length],
      x: 90 + (visibleCards.length % 4) * 210,
      y: 90 + Math.floor(visibleCards.length / 4) * 270,
      flipped: false,
    }

    setCards((current) => [...current, newCard])
    setSelectedCardId(newCard.id)
    setMobileInspectorOpen(true)
  }

  function deleteSelectedCard() {
    if (!selectedCard) return

    const nextSelectedCard = cards.find((card) => card.id !== selectedCard.id)
    setCards((current) => current.filter((card) => card.id !== selectedCard.id))
    setSelectedCardId(nextSelectedCard?.id ?? '')
  }

  function addFolder() {
    const nextFolder = {
      id: `folder-${Date.now()}`,
      name: `Новая папка ${folders.length + 1}`,
    }
    setFolders((current) => [...current, nextFolder])
    setActiveFolderId(nextFolder.id)
    setEditingFolderId(nextFolder.id)
  }

  function updateFolderName(folderId: string, name: string) {
    setFolders((current) =>
      current.map((folder) => (folder.id === folderId ? { ...folder, name } : folder)),
    )
  }

  function deleteFolder(folderId: string) {
    if (folders.length <= 1) return

    const fallbackFolder = folders.find((folder) => folder.id !== folderId)
    if (!fallbackFolder) return

    setFolders((current) => current.filter((folder) => folder.id !== folderId))
    setCards((current) => current.filter((card) => card.folderId !== folderId))
    setActiveFolderId((current) => (current === folderId ? fallbackFolder.id : current))
    setEditingFolderId((current) => (current === folderId ? null : current))
    setSelectedCardId((current) => {
      const selectedStillExists = cards.some(
        (card) => card.id === current && card.folderId !== folderId,
      )
      return selectedStillExists
        ? current
        : cards.find((card) => card.folderId !== folderId)?.id ?? ''
    })
  }

  function startCardDrag(
    event: React.PointerEvent<HTMLElement>,
    card: DeckCard,
  ) {
    if ((event.target as HTMLElement).closest('button')) return

    const boardElement = boardRef.current
    const boardRect = boardElement?.getBoundingClientRect()
    if (!boardElement || !boardRect) return
    const board = boardElement
    const rect = boardRect

    setSelectedCardId(card.id)
    setDraggingId(card.id)

    const offsetX = event.clientX - rect.left + board.scrollLeft - card.x
    const offsetY = event.clientY - rect.top + board.scrollTop - card.y

    event.currentTarget.setPointerCapture(event.pointerId)

    function moveCard(moveEvent: PointerEvent) {
      const nextX = moveEvent.clientX - rect.left + board.scrollLeft - offsetX
      const nextY = moveEvent.clientY - rect.top + board.scrollTop - offsetY

      updateCard(card.id, {
        x: Math.max(24, Math.min(2180, nextX)),
        y: Math.max(24, Math.min(1450, nextY)),
      })
    }

    function stopDrag(upEvent: PointerEvent) {
      const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)
      const folderTarget = target?.closest<HTMLElement>('[data-folder-id]')
      if (folderTarget) {
        const folderId = folderTarget.dataset.folderId
        if (folderId && folderId !== card.folderId) {
          updateCard(card.id, { folderId, x: 72, y: 72, flipped: false })
          setActiveFolderId(folderId)
        }
      }

      setDraggingId(null)
      window.removeEventListener('pointermove', moveCard)
      window.removeEventListener('pointerup', stopDrag)
    }

    window.addEventListener('pointermove', moveCard)
    window.addEventListener('pointerup', stopDrag)
  }

  return (
    <main className={sidebarCollapsed ? 'archive-app sidebar-collapsed' : 'archive-app'}>
      <aside className="sidebar" aria-label="Папки архива">
        <div className="sidebar-top">
          <div className="brand-block">
            <p>Архив колоды</p>
            <h1>Фрагменты речи</h1>
          </div>
          <button
            className="icon-button collapse-button"
            type="button"
            aria-label={sidebarCollapsed ? 'Развернуть папки' : 'Свернуть папки'}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <button className="text-button add-folder" type="button" onClick={addFolder}>
          <span>+ Папка</span>
          <strong>+</strong>
        </button>

        <nav className="folder-list" aria-label="Список папок">
          {folders.map((folder) => {
            const isEditing = editingFolderId === folder.id

            return (
              <div
                className={folder.id === activeFolderId ? 'folder-row active' : 'folder-row'}
                data-folder-id={folder.id}
                key={folder.id}
              >
                <button
                  className="folder"
                  type="button"
                  onClick={() => setActiveFolderId(folder.id)}
                >
                  <span className="folder-initial">{getFolderInitial(folder.name)}</span>
                  <span className="folder-name">{folder.name}</span>
                  <small>{cardCountByFolder[folder.id] ?? 0}</small>
                </button>

                <div className="folder-actions">
                  <button
                    className="mini-button"
                    type="button"
                    aria-label={`Переименовать папку ${folder.name}`}
                    onClick={() =>
                      setEditingFolderId((current) =>
                        current === folder.id ? null : folder.id,
                      )
                    }
                  >
                    Имя
                  </button>
                  <button
                    className="mini-button danger"
                    type="button"
                    aria-label={`Удалить папку ${folder.name}`}
                    disabled={folders.length <= 1}
                    onClick={() => deleteFolder(folder.id)}
                  >
                    Удалить
                  </button>
                </div>

                {isEditing ? (
                  <input
                    className="folder-name-input"
                    aria-label={`Новое название папки ${folder.name}`}
                    value={folder.name}
                    onBlur={() => setEditingFolderId(null)}
                    onChange={(event) => updateFolderName(folder.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') setEditingFolderId(null)
                    }}
                  />
                ) : null}
              </div>
            )
          })}
        </nav>
      </aside>

      <section className="workspace" aria-label="Рабочий канвас">
        <header className="topbar">
          <div>
            <p>Канвас папки</p>
            <h2>{activeFolder?.name}</h2>
          </div>
          <div className="toolbar">
            <span>{cards.length} карт всего</span>
            <span>{visibleCards.length} здесь</span>
            <button type="button" onClick={addCard}>
              + Карта
            </button>
            <button
              className="mobile-editor-button"
              type="button"
              onClick={() => setMobileInspectorOpen(true)}
            >
              Редактор
            </button>
          </div>
        </header>

        <div className="board-frame" ref={boardRef}>
          <div className="board-canvas">
            {visibleCards.map((card) => (
              <article
                className={[
                  'deck-card',
                  card.flipped ? 'flipped' : '',
                  card.id === selectedCardId ? 'selected' : '',
                  card.id === draggingId ? 'dragging' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={card.id}
                onPointerDown={(event) => startCardDrag(event, card)}
                style={{ left: card.x, top: card.y }}
              >
                <div className="card-inner">
                  <div className="card-face card-front">
                    <span className="suit">{card.suit}</span>
                    <h3>{card.title}</h3>
                    <p>{card.question}</p>
                    <small>лицевая сторона</small>
                  </div>
                  <div className="card-face card-back">
                    <span className="suit">оборот</span>
                    <p>{card.backText}</p>
                    <small>заметка автора</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside
        className={mobileInspectorOpen ? 'inspector mobile-open' : 'inspector'}
        aria-label="Редактор карты"
      >
        {selectedCard ? (
          <>
            <div className="inspector-heading">
              <div>
                <p>Редактор карты</p>
                <h2>{selectedCard.title}</h2>
                <span className="side-status">
                  Сейчас на канвасе: {selectedCard.flipped ? 'оборот' : 'лицевая сторона'}
                </span>
              </div>
              <button
                className="sheet-toggle"
                type="button"
                onClick={() => setMobileInspectorOpen((current) => !current)}
              >
                {mobileInspectorOpen ? 'Свернуть' : 'Открыть'}
              </button>
            </div>

            <div className="side-switch" aria-label="Переключение стороны карты">
              <button
                className={!selectedCard.flipped ? 'active' : ''}
                type="button"
                onClick={() => updateCard(selectedCard.id, { flipped: false })}
              >
                Лицевая
              </button>
              <button
                className={selectedCard.flipped ? 'active' : ''}
                type="button"
                onClick={() => updateCard(selectedCard.id, { flipped: true })}
              >
                Оборот
              </button>
            </div>

            <label>
              Название карты
              <input
                value={selectedCard.title}
                onChange={(event) =>
                  updateCard(selectedCard.id, { title: event.target.value })
                }
              />
            </label>

            <label>
              Что видят игроки
              <textarea
                rows={5}
                value={selectedCard.question}
                onChange={(event) =>
                  updateCard(selectedCard.id, { question: event.target.value })
                }
              />
            </label>

            <label>
              Оборот / заметка автора
              <textarea
                rows={5}
                value={selectedCard.backText}
                onChange={(event) =>
                  updateCard(selectedCard.id, { backText: event.target.value })
                }
              />
            </label>

            <div className="field-grid">
              <label>
                Масть
                <select
                  value={selectedCard.suit}
                  onChange={(event) =>
                    updateCard(selectedCard.id, {
                      suit: event.target.value as CardSuit,
                    })
                  }
                >
                  {suits.map((suit) => (
                    <option key={suit} value={suit}>
                      {suit}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Папка
                <select
                  value={selectedCard.folderId}
                  onChange={(event) => {
                    updateCard(selectedCard.id, { folderId: event.target.value })
                    setActiveFolderId(event.target.value)
                  }}
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="gameplay-note">
              <strong>Как это читать:</strong>
              <span>лицевая сторона — карточка для игры; оборот — авторская заметка, правило или расшифровка.</span>
            </div>

            <div className="inspector-actions">
              <button
                type="button"
                onClick={() =>
                  updateCard(selectedCard.id, { flipped: !selectedCard.flipped })
                }
              >
                {selectedCard.flipped ? 'Показать лицевую' : 'Показать оборот'}
              </button>
              <button className="danger" type="button" onClick={deleteSelectedCard}>
                Удалить карту
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>Выбери карту</h2>
            <p>Кликни по карте на канвасе, чтобы редактировать ее текст и папку.</p>
          </div>
        )}
      </aside>
    </main>
  )
}

export default App
