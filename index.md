---
layout: default
title: Inicio
---

{% for post in site.posts %}
<div class="post">
  <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
  <p><small>{{ post.date | date: "%d %b %Y" }}</small></p>
</div>
{% endfor %}
