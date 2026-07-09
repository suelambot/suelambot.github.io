---
layout: home
title: Home
---

This space is a collection of reflections on software architecture in general, and on bringing order to chaos in particular.<br/>
I believe good architecture is not about adding abstractions, but about reducing cognitive load and making systems easier to understand, evolve, and document.

I don't claim to have all the answers. I'm simply documenting my journey and sharing what I learn along the way, in the hope that it might inspire others.
<div class="article-listing">

{% for post in site.posts limit:3 %}
<article>
  <h2>
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </h2>

  <p>
    <time datetime="{{ post.date | date_to_xmlschema }}">
      {{ post.date | date: "%B %-d, %Y" }}
    </time>
  </p>

{% if post.excerpt %}
{{ post.excerpt }}
{% endif %}
</article>
{% endfor %}
</div>

[View all articles →]({{ "/articles" | relative_url }})
