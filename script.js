(function () {
  // ---- Theme toggle ----
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  function iconFor(t) {
    return t === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  toggle.innerHTML = iconFor(theme);
  toggle.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
    toggle.innerHTML = iconFor(theme);
    toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    renderGraph(); // re-render to pick up CSS var colors
  });

  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ================= KNOWLEDGE GRAPH =================
  let graphData = null;
  let simulation = null;

  function renderGraph() {
    if (!graphData) return;
    const svgEl = document.getElementById('graph-svg');
    svgEl.innerHTML = '';
    const bbox = svgEl.getBoundingClientRect();
    const width = bbox.width || 1000;
    const height = 620;
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const colorFor = (type) => {
      if (type === 'person_center') return cssVar('--color-primary');
      if (type === 'topic') return cssVar('--color-topic');
      return cssVar('--color-collab');
    };

    const svg = d3.select(svgEl);
    const g = svg.append('g');

    svg.call(
      d3.zoom().scaleExtent([0.4, 3]).on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
    );

    const nodes = graphData.nodes.map((d) => Object.assign({}, d));
    const links = graphData.edges.map((d) => Object.assign({}, d));

    const weightExtent = d3.extent(nodes.filter((d) => d.type !== 'person_center'), (d) => d.weight || 0);
    const radiusScale = d3.scaleSqrt().domain([Math.max(weightExtent[0], 1), weightExtent[1]]).range([9, 30]).clamp(true);
    nodes.forEach((d) => { d.r = d.type === 'person_center' ? 34 : radiusScale(d.weight || 1); });

    simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((d) => 200 - Math.min(d.weight * 1.2, 130)).strength(0.3))
      .force('charge', d3.forceManyBody().strength((d) => (d.type === 'person_center' ? -1600 : -180)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => d.r + 20));

    const link = g
      .append('g')
      .attr('stroke-opacity', 0.35)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', cssVar('--color-border'))
      .attr('stroke-width', (d) => Math.max(1, Math.sqrt(d.weight)));

    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    node
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => colorFor(d.type))
      .attr('fill-opacity', (d) => (d.type === 'person_center' ? 1 : 0.85))
      .attr('stroke', cssVar('--color-bg'))
      .attr('stroke-width', 1.5);

    node
      .append('text')
      .text((d) => d.id)
      .attr('x', (d) => d.r + 6)
      .attr('y', 4)
      .attr('font-size', (d) => (d.type === 'person_center' ? 15 : 11))
      .attr('font-weight', (d) => (d.type === 'person_center' ? 700 : 500))
      .attr('fill', cssVar('--color-text'))
      .attr('font-family', 'var(--font-body)')
      .style('pointer-events', 'none');

    const tooltip = document.getElementById('graph-tooltip');

    node
      .on('mouseenter', (event, d) => {
        tooltip.hidden = false;
        const label = d.type === 'person_center' ? 'Center of the corpus' : d.type === 'topic' ? 'Research theme' : 'Collaborator';
        tooltip.innerHTML = `<strong>${d.id}</strong><br>${label}${d.type !== 'person_center' ? ` &middot; connected via ${Math.round((links.find(l => (l.source.id||l.source)===d.id || (l.target.id||l.target)===d.id)||{}).weight||0)} shared papers` : ''}`;
      })
      .on('mousemove', (event) => {
        const shellRect = svgEl.parentElement.getBoundingClientRect();
        tooltip.style.left = event.clientX - shellRect.left + 14 + 'px';
        tooltip.style.top = event.clientY - shellRect.top + 14 + 'px';
      })
      .on('mouseleave', () => { tooltip.hidden = true; })
      .on('click', (event, d) => {
        const connected = new Set([d.id]);
        links.forEach((l) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          if (s === d.id) connected.add(t);
          if (t === d.id) connected.add(s);
        });
        node.style('opacity', (n) => (connected.has(n.id) ? 1 : 0.12));
        link.style('opacity', (l) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          return connected.has(s) && connected.has(t) ? 0.7 : 0.03;
        });
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null; d.fy = null;
    }

    document.getElementById('graph-reset').onclick = () => {
      node.style('opacity', 1);
      link.style('opacity', 0.35);
      svg.transition().duration(500).call(d3.zoom().transform, d3.zoomIdentity);
    };
  }

  // ================= TIMELINE CHART =================
  function renderTimeline(data) {
    const svgEl = document.getElementById('timeline-svg');
    const width = svgEl.getBoundingClientRect().width || 900;
    const height = 340;
    const margin = { top: 20, right: 20, bottom: 34, left: 40 };
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.innerHTML = '';
    const svg = d3.select(svgEl);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([margin.left, width - margin.right])
      .padding(0.25);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) * 1.1])
      .range([height - margin.bottom, margin.top]);

    const eraColor = (year) => {
      if (year < 2016) return cssVar('--color-primary');
      if (year < 2025) return cssVar('--color-topic');
      return cssVar('--color-collab');
    };

    svg
      .append('g')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => x(d.year))
      .attr('y', (d) => y(0))
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('rx', 3)
      .attr('fill', (d) => eraColor(d.year))
      .transition()
      .duration(700)
      .delay((d, i) => i * 25)
      .attr('y', (d) => y(d.count))
      .attr('height', (d) => y(0) - y(d.count));

    svg
      .append('g')
      .selectAll('text.value')
      .data(data)
      .join('text')
      .attr('class', 'value')
      .attr('x', (d) => x(d.year) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.count) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', cssVar('--color-text-muted'))
      .style('font-variant-numeric', 'tabular-nums')
      .text((d) => d.count);

    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('x', (d) => x(d.year) + x.bandwidth() / 2)
      .attr('y', 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', cssVar('--color-text-faint'))
      .text((d) => (d.year % 2 === 0 ? d.year : ''));
  }

  // ================= DISCOVERIES =================
  function renderDiscoveries(landmarks) {
    const grid = document.getElementById('discoveries-grid');
    const order = [
      'SChLAP1', 'PCAT1 / lncRNAs', 'TMPRSS2-ERG fusion', 'PARP inhibition / DNA repair',
      'Decipher genomic classifier', 'Circulating tumor DNA / liquid biopsy', 'Immunotherapy / gene therapy',
      'Castration-resistant prostate cancer', 'Health disparities / equity',
    ];
    const byTopic = Object.fromEntries(landmarks.map((l) => [l.topic, l]));
    order.filter((t) => byTopic[t]).forEach((topic) => {
      const l = byTopic[topic];
      const card = document.createElement('article');
      card.className = 'discovery-card';
      const link = l.doi ? `https://doi.org/${l.doi}` : (l.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${l.pmid}/` : '#');
      card.innerHTML = `
        <span class="discovery-year">${l.year || 'n.d.'}</span>
        <h3 class="discovery-theme">${topic}</h3>
        <p class="discovery-title">${l.title}</p>
        <p class="discovery-journal">${l.journal || ''}</p>
        <a class="discovery-link" href="${link}" target="_blank" rel="noopener">Read the paper &rarr;</a>
      `;
      grid.appendChild(card);
    });
  }

  // ================= COLLABORATORS =================
  function renderCollaborators(nodes) {
    const list = document.getElementById('collab-list');
    const collabs = nodes.filter((n) => n.type === 'collaborator').sort((a, b) => b.size - a.size);
    const max = collabs[0].size;
    collabs.forEach((c, i) => {
      const count = Math.round(c.size - 8);
      const row = document.createElement('div');
      row.className = 'collab-row';
      row.innerHTML = `
        <span class="collab-rank">${i + 1}</span>
        <div class="collab-bar-wrap">
          <div class="collab-name">${c.id}</div>
          <div class="collab-bar-track"><div class="collab-bar-fill" style="width:${(c.size / max) * 100}%"></div></div>
        </div>
        <span class="collab-count">${count}</span>
      `;
      list.appendChild(row);
    });
  }

  // ================= LOAD DATA =================
  Promise.all([
    fetch('data/graph_data.json').then((r) => r.json()),
    fetch('data/timeline_data.json').then((r) => r.json()),
    fetch('data/landmark_papers.json').then((r) => r.json()),
  ]).then(([graph, timeline, landmarks]) => {
    graphData = graph;
    renderGraph();
    renderTimeline(timeline);
    renderDiscoveries(landmarks);
    renderCollaborators(graph.nodes);
  }).catch((err) => {
    console.error('Failed to load data', err);
  });

  window.addEventListener('resize', () => {
    clearTimeout(window.__resizeTimer);
    window.__resizeTimer = setTimeout(() => { if (graphData) renderGraph(); }, 300);
  });
})();
