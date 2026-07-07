---
layout: default
title: Inicio
---

{% assign published_posts = site.posts | where_exp: "post", "post.published != false" %}

{% if published_posts.size > 0 %}
  {% for post in published_posts %}
  <article class="post post_preview">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p><small>{{ post.date | date: "%d %b %Y" }}</small></p>
  </article>
  {% endfor %}
{% else %}
  <section class="empty_state" aria-labelledby="empty-title">
    <p class="empty_state_kicker">Artículos en pausa</p>
    <h2 id="empty-title">Estoy reorganizando este espacio.</h2>
    <p>
      Los posts están desactivados temporalmente mientras curo el contenido. Mientras tanto, puedes revisar mi
      portafolio para conocer las tecnologías y áreas en las que trabajo.
    </p>
    <a class="button_link" href="{{ '/portafolio/' | relative_url }}">Ver portafolio</a>
  </section>
{% endif %}
