import './App.css'

function App() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="На главную">
          <span className="brand-mark" aria-hidden="true" />
          <span>Название проекта</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#about">О проекте</a>
          <a href="#cards">Карточки</a>
          <a href="#contact">Контакты</a>
        </nav>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="placeholder-label">Каркас сайта</p>
          <h1>Название карточной игры</h1>
          <p>
            Здесь позже появится короткое описание: для кого игра, какой у нее
            тон и почему в нее хочется сыграть.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#about">
              Начать
            </a>
            <a className="button secondary" href="#cards">
              Смотреть блоки
            </a>
          </div>
        </div>
        <div className="visual-placeholder" aria-label="Место для будущего визуала">
          <div />
          <div />
          <div />
        </div>
      </section>

      <section className="content-section" id="about">
        <div>
          <p className="placeholder-label">Блок 01</p>
          <h2>О проекте</h2>
        </div>
        <p>
          Текст этого блока пока намеренно простой. Сюда можно будет добавить
          идею, настроение и описание формата игры.
        </p>
      </section>

      <section className="content-section split" id="cards">
        <div>
          <p className="placeholder-label">Блок 02</p>
          <h2>Карточки</h2>
          <p>
            Здесь позже появятся примеры карточек, вопросы или описание набора.
          </p>
        </div>
        <div className="card-placeholders" aria-label="Места для карточек">
          <article />
          <article />
          <article />
        </div>
      </section>

      <section className="content-section" id="contact">
        <div>
          <p className="placeholder-label">Блок 03</p>
          <h2>Финальный блок</h2>
        </div>
        <p>
          Тут можно будет поставить призыв, форму, ссылку на презентацию или
          любую информацию для дипломной защиты.
        </p>
      </section>
    </main>
  )
}

export default App
