---
layout: default
title: Inicio
---

<section class="hero">
  <p class="eyebrow">CUADERNO TÉCNICO</p>
  <h1>Poc Vault</h1>
  <p class="lead">En esta página se subirán Writeups y POCs. La idea principal de esta web es tener un lugar donde podamos encontrar POCs de las vulnerabilidades que deseamos explotar y con un aprendizaje responsable.</p>
</section>

<section class="publication-section" aria-labelledby="publicaciones-titulo">
  <div class="section-heading">
    <h2 class="section-title" id="publicaciones-titulo">Publicaciones</h2>
    <label class="search-box">
      <span class="sr-only">Buscar publicaciones</span>
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m16 16 5 5"></path></svg>
      <input id="post-search" type="search" placeholder="Buscar CVE, título o tema…" autocomplete="off" aria-controls="post-cards">
      <button id="clear-search" class="clear-search" type="button" aria-label="Limpiar búsqueda" hidden>×</button>
    </label>
  </div>
  <p id="search-status" class="search-status" aria-live="polite"></p>

  <div class="cards" id="post-cards">
    {% assign articles = site.pages | where: "layout", "writeup" | sort: "date" | reverse %}
    {% for article in articles %}
      <article class="card" data-search="{{ article.title | escape }} {{ article.description | escape }} {{ article.category | escape }} {{ article.url | escape }}">
        <a class="card-main" href="{{ article.url | relative_url | escape }}">
          {% if article.image %}
            <img class="card-image" src="{{ article.image | relative_url | escape }}" alt="" loading="lazy">
          {% endif %}
          <div class="card-body">
            <p class="eyebrow">{{ article.category | default: "WRITEUP" | escape }}</p>
            <h3>{{ article.title | escape }}</h3>
            <p>{{ article.description | escape }}</p>
            {% if article.date %}<time datetime="{{ article.date | date: '%Y-%m-%d' }}">{{ article.date | date: "%d-%m-%Y" }}</time>{% endif %}
            <span class="read-link">Leer writeup →</span>
          </div>
        </a>
        <div class="card-actions" aria-label="Acciones de {{ article.title | escape }}">
          <button class="icon-button like-button" type="button" data-like data-slug="{{ article.url | escape }}" aria-label="Me gusta: {{ article.title | escape }}" title="Me gusta" aria-pressed="false">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"></path></svg>
            <span class="like-count" data-like-count>—</span>
          </button>
          <button class="icon-button share-button" type="button" data-share data-url="{{ article.url | relative_url | escape }}" data-title="{{ article.title | escape }}" aria-label="Compartir {{ article.title | escape }}" title="Compartir">
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"></path></svg>
          </button>
          <span class="like-status" data-like-status aria-live="polite"></span>
        </div>
      </article>
    {% else %}
      <p>Aún no hay publicaciones. Añade tu primer writeup dentro de <code>writeups/</code>.</p>
    {% endfor %}
  </div>
  <p id="no-search-results" class="empty-results" hidden>No hay publicaciones que coincidan con la búsqueda.</p>
</section>
