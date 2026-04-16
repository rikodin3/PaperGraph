const API_BASE = window.localStorage.getItem("graphScholarApiBase") || window.location.origin;

const landingView = document.getElementById("landing-view");
const graphView = document.getElementById("graph-view");
const searchResults = document.getElementById("search-results");
const historyList = document.getElementById("history-list");
const relatedList = document.getElementById("related-list");
const detailsContainer = document.getElementById("paper-details");
const graphTitle = document.getElementById("graph-title");
const graphMeta = document.getElementById("graph-meta");
const graphBadge = document.getElementById("graph-badge");

const topSearchForm = document.getElementById("top-search-form");
const topSearchInput = document.getElementById("top-search-input");
const heroSearchForm = document.getElementById("hero-search-form");
const heroSearchInput = document.getElementById("hero-search-input");
const homeBtn = document.getElementById("home-btn");

const SEARCH_HISTORY_KEY = "graphScholarSearchHistoryV1";
const GRAPH_CACHE_KEY = "graphScholarGraphCacheV1";
const MAX_HISTORY_ITEMS = 12;
const MAX_CACHE_ITEMS = 18;

let cy;
let currentPaperId = null;
let graphRenderVersion = 0;
let currentLayout = null;
let graphHistory = loadSearchHistory();
let graphCache = loadGraphCache();

function safeDestroyGraph() {
  if (!cy) {
    return;
  }

  try {
    cy.stop();
    cy.elements().stop();
    cy.destroy();
  } catch (error) {
    console.warn("Graph teardown warning:", error);
  } finally {
    cy = null;
  }
}

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed ${response.status}: ${text}`);
  }
  return response.json();
}

function loadSearchHistory() {
  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && Number.isFinite(Number(item.id)))
      .map((item) => ({
        id: Number(item.id),
        title: item.title || `Paper ${item.id}`,
        year: item.year ?? null,
        citationCount: item.citationCount ?? null,
        lastViewedAt: item.lastViewedAt || new Date().toISOString(),
      }));
  } catch (error) {
    console.warn("History load warning:", error);
    return [];
  }
}

function persistSearchHistory() {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(graphHistory));
  } catch (error) {
    console.warn("History save warning:", error);
  }
}

function loadGraphCache() {
  try {
    const raw = window.localStorage.getItem(GRAPH_CACHE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("Graph cache load warning:", error);
    return {};
  }
}

function pruneGraphCache() {
  const keys = Object.keys(graphCache);
  if (keys.length <= MAX_CACHE_ITEMS) {
    return;
  }

  const sorted = keys.sort((a, b) => {
    const aUpdated = new Date(graphCache[a]?.updatedAt || 0).getTime();
    const bUpdated = new Date(graphCache[b]?.updatedAt || 0).getTime();
    return bUpdated - aUpdated;
  });

  const keep = new Set(sorted.slice(0, MAX_CACHE_ITEMS));
  Object.keys(graphCache).forEach((key) => {
    if (!keep.has(key)) {
      delete graphCache[key];
    }
  });
}

function persistGraphCache() {
  pruneGraphCache();
  try {
    window.localStorage.setItem(GRAPH_CACHE_KEY, JSON.stringify(graphCache));
  } catch (error) {
    console.warn("Graph cache save warning:", error);
  }
}

function getCachedEntry(paperId) {
  return graphCache[String(paperId)] || null;
}

function setCachedEntry(paperId, patch) {
  const key = String(paperId);
  const current = graphCache[key] || {};
  graphCache[key] = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  persistGraphCache();
}

function upsertHistoryFromPaper(paper) {
  if (!paper || !Number.isFinite(Number(paper.id))) {
    return;
  }

  const id = Number(paper.id);
  const existingIndex = graphHistory.findIndex((item) => item.id === id);
  const nextItem = {
    id,
    title: paper.title || `Paper ${id}`,
    year: paper.year ?? null,
    citationCount: paper.citationCount ?? null,
    lastViewedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    graphHistory.splice(existingIndex, 1);
  }

  graphHistory.unshift(nextItem);
  graphHistory = graphHistory.slice(0, MAX_HISTORY_ITEMS);
  persistSearchHistory();
  renderHistoryList();
}

function renderHistoryList() {
  if (!historyList) {
    return;
  }

  if (!graphHistory.length) {
    historyList.innerHTML = '<p class="history-empty">No graphs viewed yet.</p>';
    return;
  }

  historyList.innerHTML = graphHistory
    .map(
      (item) => `
      <div class="history-item">
        <div class="history-main">
          <div class="history-title">${escapeHtml(item.title || `Paper ${item.id}`)}</div>
          <div class="history-meta">${item.year || "Unknown year"} | Citations: ${item.citationCount ?? "NA"}</div>
        </div>
        <button type="button" class="history-see-btn" data-id="${item.id}">See Graph</button>
      </div>
    `
    )
    .join("");

  historyList.querySelectorAll(".history-see-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.id);
      await loadGraphForPaper(id, { preferCache: true });
    });
  });
}

function showLandingView() {
  graphView.classList.add("hidden");
  landingView.classList.remove("hidden");
  if (homeBtn) {
    homeBtn.classList.add("hidden");
  }
  landingView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showGraphView() {
  landingView.classList.add("hidden");
  graphView.classList.remove("hidden");
  if (homeBtn) {
    homeBtn.classList.remove("hidden");
  }
  graphView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSearchResults(results) {
  if (!results.length) {
    searchResults.innerHTML = '<p class="error">No papers found. Try another query.</p>';
    return;
  }

  searchResults.innerHTML = results
    .map(
      (paper) => `
      <button type="button" class="result-item" data-id="${paper.id}">
        <div class="result-title">${escapeHtml(paper.title || "Untitled")}</div>
        <div class="result-meta">
          ${paper.year || "Year unknown"} | Citations: ${paper.citationCount ?? "NA"} | Corpus ID: ${paper.id}
        </div>
      </button>
    `
    )
    .join("");

  searchResults.querySelectorAll(".result-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const id = Number(item.dataset.id);
      await loadGraphForPaper(id);
    });
  });
}

async function performSearch(query) {
  if (!query || query.length < 2) {
    searchResults.innerHTML = '<p class="error">Type at least 2 characters.</p>';
    return;
  }

  searchResults.innerHTML = "<p>Searching...</p>";
  try {
    const results = await apiGet(`/papers/search?q=${encodeURIComponent(query)}&limit=12`);
    renderSearchResults(results);
  } catch (error) {
    searchResults.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

function buildElements(graphData, centerId) {
  const toShortLabel = (title, year, fallbackId) => {
    const titleText = String(title || "").trim();
    let stem = "";

    if (titleText.includes(",")) {
      stem = titleText.split(",")[0].trim();
    } else if (titleText.length) {
      stem = titleText.split(/\s+/)[0].trim();
    }

    stem = stem.replace(/[^\w'-]/g, "");
    if (!stem) {
      stem = `Paper${fallbackId}`;
    }

    return year ? `${stem}, ${year}` : stem;
  };

  const nodes = graphData.nodes.map((node) => ({
    data: {
      id: String(node.id),
      label: node.title || String(node.id),
      shortLabel: toShortLabel(node.title, node.year, node.id),
      year: node.year,
      citationCount: node.citationCount ?? 0,
      paperId: node.id,
    },
  }));

  const edges = graphData.edges.map((edge, index) => ({
    data: {
      id: `${edge.source}-${edge.target}-${index}`,
      source: String(edge.source),
      target: String(edge.target),
    },
  }));

  const elementIds = new Set(nodes.map((n) => n.data.id));
  const centerNodeId = String(centerId);
  if (!elementIds.has(centerNodeId)) {
    nodes.push({
      data: {
        id: centerNodeId,
        label: `Paper ${centerNodeId}`,
        shortLabel: `Paper${centerNodeId}`,
        paperId: centerId,
        citationCount: 0,
      },
    });
  }

  return [...nodes, ...edges];
}

function yearToColor(year, minYear, maxYear) {
  if (!year || !minYear || !maxYear || minYear === maxYear) {
    return "#4a8a8d";
  }

  const ratio = Math.max(0, Math.min(1, (year - minYear) / (maxYear - minYear)));
  const r = Math.round(191 - 91 * ratio);
  const g = Math.round(221 - 89 * ratio);
  const b = Math.round(220 - 119 * ratio);
  return `rgb(${r},${g},${b})`;
}

function enrichNodeMetrics(elements) {
  const nodes = elements.filter((el) => !el.data.source);
  const years = nodes
    .map((n) => Number(n.data.year))
    .filter((year) => Number.isFinite(year) && year > 1800 && year < 2100);

  const minYear = years.length ? Math.min(...years) : null;
  const maxYear = years.length ? Math.max(...years) : null;

  const citationValues = nodes.map((n) => Number(n.data.citationCount) || 0);
  const maxCitation = citationValues.length ? Math.max(...citationValues) : 0;
  const maxCitationLog = Math.log1p(maxCitation || 1);
  const sortedCitations = [...citationValues].sort((a, b) => a - b);
  const findRankRatio = (value) => {
    if (sortedCitations.length <= 1) {
      return 0;
    }

    const lastIndex = sortedCitations.lastIndexOf(value);
    return lastIndex / (sortedCitations.length - 1);
  };

  nodes.forEach((node) => {
    node.data.color = yearToColor(Number(node.data.year), minYear, maxYear);
    node.data.citationCount = Number(node.data.citationCount) || 0;

    const citationLog = Math.log1p(node.data.citationCount);
    const logRatio = maxCitationLog > 0 ? citationLog / maxCitationLog : 0;
    const rankRatio = findRankRatio(node.data.citationCount);

    // Blend log scaling (handles very large citation ranges) with rank scaling
    // so size differences remain visible even in small graphs.
    const ratio = Math.max(0, Math.min(1, logRatio * 0.6 + rankRatio * 0.4));
    node.data.nodeSize = Math.round(8 + ratio * 100);
  });
}

function buildSinglePaperGraph(paper) {
  const shortStem = String(paper.title || "Paper")
    .trim()
    .split(/\s+/)[0]
    .replace(/[^\w'-]/g, "");

  return [
    {
      data: {
        id: String(paper.id),
        label: paper.title || String(paper.id),
        shortLabel: paper.year ? `${shortStem || "Paper"}, ${paper.year}` : shortStem || "Paper",
        year: paper.year,
        citationCount: Number(paper.citationCount) || 0,
        paperId: paper.id,
      },
    },
  ];
}

function initGraph(elements, centerId) {
  if (!window.cytoscape) {
    throw new Error("Graph library failed to load. Please refresh the page.");
  }

  enrichNodeMetrics(elements);

  const graphStyles = [
      {
        selector: "node",
        style: {
          "background-color": "data(color)",
          "border-color": "#b6ddd9",
          "border-width": 1,
          width: "data(nodeSize)",
          height: "data(nodeSize)",
          label: "data(shortLabel)",
          "font-size": 9,
          color: "#0b1f24",
          "text-wrap": "none",
          "text-halign": "center",
          "text-valign": "center",
          "text-outline-color": "rgba(243,245,244,0.85)",
          "text-outline-width": 2,
        },
      },
      {
        selector: "node.center",
        style: {
          "background-color": "#0f6d72",
          "border-width": 3,
          "border-color": "#dbf2ef",
          "font-size": 10,
        },
      },
      {
        selector: "node.selected",
        style: {
          "background-color": "#b03e63",
          "border-color": "#ffd1dd",
          "border-width": 2,
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.2,
          "line-color": "#aab8b6",
          opacity: 0.55,
          "curve-style": "bezier",
        },
      },
    ];

  if (!cy) {
    cy = cytoscape({
      container: document.getElementById("graph-canvas"),
      elements: [],
      style: graphStyles,
      layout: { name: "preset" },
    });
  }

  if (currentLayout) {
    try {
      currentLayout.stop();
    } catch (error) {
      console.warn("Layout stop warning:", error);
    }
    currentLayout = null;
  }

  cy.removeAllListeners("tap");
  cy.elements().remove();
  cy.add(elements);
  cy.style(graphStyles);

  currentLayout = cy.layout({
    name: "cose",
    animate: false,
    nodeRepulsion: 190000,
    idealEdgeLength: 110,
    gravity: 1,
    numIter: 1300,
  });
  currentLayout.run();

  cy.nodes().forEach((node) => {
    node.data("degree", node.connectedEdges().length);
    if (Number(node.id()) === centerId) {
      node.addClass("center");
      node.addClass("selected");
    }
  });

  cy.on("tap", "node", async (evt) => {
    const node = evt.target;
    const id = Number(node.data("paperId"));
    currentPaperId = id;

    cy.nodes().removeClass("selected");
    node.addClass("selected");

    await Promise.all([loadPaperDetails(id), loadRelated(id)]);
  });
}

function renderDetails(paper) {
  const authors = Array.isArray(paper.authors) && paper.authors.length ? paper.authors.join(", ") : "Unknown authors";
  const links = [
    paper.url ? `<a href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">Semantic Scholar</a>` : "",
    paper.openAccessPdf ? `<a href="${escapeHtml(paper.openAccessPdf)}" target="_blank" rel="noreferrer">Open PDF</a>` : "",
    paper.arxivUrl ? `<a href="${escapeHtml(paper.arxivUrl)}" target="_blank" rel="noreferrer">arXiv</a>` : "",
  ]
    .filter(Boolean)
    .join("");

  detailsContainer.innerHTML = `
    <h3 class="paper-title">${escapeHtml(paper.title || "Untitled")}</h3>
    <p class="paper-authors">${escapeHtml(authors)}</p>
    <p class="paper-stats">
      ${paper.year || "Unknown year"} | Citations: ${paper.citationCount ?? "NA"} | Influential: ${paper.influentialCitationCount ?? "NA"}
    </p>
    <p class="paper-stats">
      Incoming: ${paper.incoming ?? 0} | Outgoing: ${paper.outgoing ?? 0} | References: ${paper.referenceCount ?? "NA"}
    </p>
    <div class="paper-links">${links || "<span>No external links available.</span>"}</div>
    ${paper.tldr ? `<p><strong>TLDR:</strong> ${escapeHtml(paper.tldr)}</p>` : ""}
    <p class="paper-abstract">${escapeHtml(paper.abstract || "No abstract available.")}</p>
  `;
}

async function loadPaperDetails(paperId) {
  detailsContainer.innerHTML = "<p>Loading details...</p>";
  try {
    const cached = getCachedEntry(paperId);
    if (cached?.paper) {
      renderDetails(cached.paper);
      const cachedTitle = cached.paper.title || `Paper ${paperId}`;
      graphTitle.textContent = cachedTitle;
      graphMeta.textContent = `${cached.paper.year || "Unknown year"} | Corpus ID: ${paperId}`;
      return cached.paper;
    }

    const paper = await apiGet(`/papers/${paperId}`);
    renderDetails(paper);
    setCachedEntry(paperId, { paper });

    const titleText = paper.title || `Paper ${paperId}`;
    graphTitle.textContent = titleText;
    graphMeta.textContent = `${paper.year || "Unknown year"} | Corpus ID: ${paperId}`;
    return paper;
  } catch (error) {
    detailsContainer.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    return null;
  }
}

function renderRelated(related) {
  if (!related.length) {
    relatedList.innerHTML = "<li>No related works found.</li>";
    return;
  }

  relatedList.innerHTML = related
    .map(
      (item) => `
      <li>
        <button type="button" class="related-item ${item.id === currentPaperId ? "active" : ""}" data-id="${item.id}">
          <div class="related-title">${escapeHtml(item.title || "Untitled")}</div>
          <div class="related-meta">
            ${item.year || "Unknown year"} | 
            ${item.similarity !== undefined ? `Sim: ${item.similarity.toFixed(3)}` : `Overlap: ${item.overlap}`}
          </div>
        </button>
      </li>
    `
    )
    .join("");

  relatedList.querySelectorAll(".related-item").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextId = Number(button.dataset.id);
      await loadGraphForPaper(nextId);
    });
  });
}

async function loadRelated(paperId, options = {}) {
  const { preferCache = true } = options;
  relatedList.innerHTML = "<li>Loading related papers...</li>";
  try {
    const cached = getCachedEntry(paperId);
    if (preferCache && Array.isArray(cached?.related)) {
      renderRelated(cached.related);
      return cached.related;
    }

    const related = await apiGet(`/graph/related-embedding/${paperId}?k=22`);
    renderRelated(related);
    setCachedEntry(paperId, { related });
    return related;
  } catch (error) {
    console.warn("Embedding-based related failed, falling back to overlap:", error);
    try {
      const fallback = await apiGet(`/graph/related/${paperId}?k=22`);
      renderRelated(fallback);
      setCachedEntry(paperId, { related: fallback });
      return fallback;
    } catch (innerError) {
      relatedList.innerHTML = `<li class="error">${escapeHtml(innerError.message)}</li>`;
      return [];
    }
  }
}

async function loadGraphForPaper(paperId, options = {}) {
  const { preferCache = true } = options;
  const renderVersion = ++graphRenderVersion;
  currentPaperId = paperId;
  showGraphView();
  graphBadge.textContent = "AI Similarity";

  graphMeta.textContent = `Corpus ID: ${paperId}`;
  detailsContainer.innerHTML = "<p>Loading details...</p>";
  relatedList.innerHTML = "<li>Loading related papers...</li>";

  try {
    const cached = getCachedEntry(paperId);
    if (preferCache && cached?.paper && cached?.graphDataResult) {
      if (renderVersion !== graphRenderVersion) {
        return;
      }

      const cachedElements = buildElements(cached.graphDataResult, paperId);
      initGraph(cachedElements, paperId);
      renderDetails(cached.paper);
      graphTitle.textContent = cached.paper.title || `Paper ${paperId}`;
      graphMeta.textContent = `${cached.paper.year || "Unknown year"} | Corpus ID: ${paperId}`;
      if (Array.isArray(cached.related)) {
        renderRelated(cached.related);
      } else {
        await loadRelated(paperId, { preferCache: true });
      }
      upsertHistoryFromPaper(cached.paper);
      return;
    }

    const [paper, graphDataResult] = await Promise.all([
      apiGet(`/papers/${paperId}`),
      apiGet(`/graph/neighborhood/${paperId}?use_embeddings=true&max_nodes=10&max_edges=120`).catch(() => null),
    ]);

    if (renderVersion !== graphRenderVersion) {
      return;
    }

    const elements = graphDataResult ? buildElements(graphDataResult, paperId) : buildSinglePaperGraph(paper);
    initGraph(elements, paperId);
    renderDetails(paper);
    setCachedEntry(paperId, { paper, graphDataResult });

    const titleText = paper.title || `Paper ${paperId}`;
    graphTitle.textContent = titleText;
    graphMeta.textContent = `${paper.year || "Unknown year"} | Corpus ID: ${paperId}`;

    await loadRelated(paperId);
    upsertHistoryFromPaper(paper);
  } catch (error) {
    detailsContainer.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

function bindForms() {
  heroSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = heroSearchInput.value.trim();
    topSearchInput.value = query;
    await performSearch(query);
  });

  topSearchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = topSearchInput.value.trim();
    heroSearchInput.value = query;

    if (graphView.classList.contains("hidden")) {
      await performSearch(query);
      return;
    }

    try {
      const results = await apiGet(`/papers/search?q=${encodeURIComponent(query)}&limit=1`);
      if (!results.length) {
        throw new Error("No paper found for this query.");
      }
      await loadGraphForPaper(results[0].id);
    } catch (error) {
      detailsContainer.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    }
  });

  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      showLandingView();
    });
  }
}

bindForms();
renderHistoryList();
