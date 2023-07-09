---
title: Escuelas
classes: wide
toc: false
---

{% for escuela in site.escuela %}
- [{{ escuela.title }}]({{ escuela.url }})
{% endfor %}
