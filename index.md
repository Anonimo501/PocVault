---
layout: default
title: Inicio
---
 
<section class="hero">
  <p class="eyebrow">CUADERNO TÉCNICO</p>
  <h1>Poc Vault</h1>
  <p class="lead">Paso a paso de POCs, con foco en el aprendizaje responsable.</p>
</section>
 
<h2 class="section-title">Publicaciones</h2>
 
<div class="cards">
  {% assign articles = site.pages | where: "layout", "writeup" | sort: "date" | reverse %}
  {% for article in articles %}
    <a class="card" href="{{ article.url | relative_url }}">
      {% if article.image %}
        <img class="card-image" src="{{ article.image | relative_url }}" alt="" loading="lazy">
      {% endif %}
      <div class="card-body">
        <p class="eyebrow">{{ article.category | default: "WRITEUP" }}</p>
        <h3>{{ article.title }}</h3>
        <p>{{ article.description }}</p>
        {% if article.date %}<time>{{ article.date | date: "%d-%m-%Y" }}</time>{% endif %}
        <span class="read-link">Leer writeup →</span>
      </div>
    </a>
  {% else %}
    <p>Aún no hay publicaciones. Añade tu primer writeup dentro de `writeups/`.</p>
  {% endfor %}
</div>
