/**
 * News Scraper Service - Veritas Fact Checking
 * 
 * Servicio para búsqueda y extracción de noticias virales:
 * - Búsqueda en Google News
 * - Extracción de artículos
 * - Detección de viralidad
 */

class NewsScraper {
  constructor() {
    this.searchEngines = [
      'https://www.google.com/search?q=',
      'https://news.google.com/search?q='
    ];
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
  }

  /**
   * Busca noticias relacionadas con un tema
   * @param {string} topic - Tema a investigar
   * @returns {Promise<Array>} Lista de artículos encontrados
   */
  async searchNews(topic) {
    console.log('[NewsScraper] Searching news for:', topic);
    
    try {
      // Construir query de búsqueda optimizada
      const query = this.buildSearchQuery(topic);
      
      // Realizar búsqueda en Google
      const searchResults = await this.performGoogleSearch(query);
      
      // Extraer artículos de los resultados
      const articles = await this.extractArticles(searchResults);
      
      // Filtrar por relevancia y calidad
      const filteredArticles = this.filterArticles(articles);
      
      // Ordenar por viralidad/recencia
      const sortedArticles = this.sortByVirality(filteredArticles);
      
      console.log('[NewsScraper] Found', sortedArticles.length, 'relevant articles');
      return sortedArticles;
      
    } catch (error) {
      console.error('[NewsScraper] Error searching news:', error);
      throw error;
    }
  }

  /**
   * Construye query de búsqueda optimizado
   */
  buildSearchQuery(topic) {
    // Añadir términos para encontrar noticias virales
    const viralTerms = [
      'viral',
      'trending',
      'última hora',
      'breaking news',
      'polémica',
      'controversia'
    ];
    
    // Crear query con múltiples variaciones
    const queries = [
      `${topic} news`,
      `${topic} viral`,
      `${topic} trending`,
      `noticias sobre ${topic}`
    ];
    
    return queries.map(q => encodeURIComponent(q));
  }

  /**
   * Realiza búsqueda en Google usando Chrome tabs API
   */
  async performGoogleSearch(queries) {
    const results = [];
    
    for (const query of queries.slice(0, 2)) { // Limitar a 2 queries
      try {
        const searchUrl = `${this.searchEngines[0]}${query}&tbm=nws`;
        
        // Crear tab temporal para búsqueda
        const tab = await this.createSearchTab(searchUrl);
        
        // Esperar carga y extraer resultados
        await this.waitForTabLoad(tab.id);
        
        const searchResults = await this.extractSearchResults(tab.id);
        results.push(...searchResults);
        
        // Cerrar tab temporal
        await chrome.tabs.remove(tab.id);
        
      } catch (error) {
        console.error('[NewsScraper] Error in search query:', error);
      }
    }
    
    return results;
  }

  /**
   * Crea una tab temporal para búsqueda
   */
  async createSearchTab(url) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ 
        url, 
        active: false,
        pinned: true 
      }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Espera a que la tab cargue
   */
  waitForTabLoad(tabId) {
    return new Promise((resolve) => {
      const checkLoading = () => {
        chrome.tabs.get(tabId, (tab) => {
          if (tab && tab.status === 'complete') {
            resolve();
          } else {
            setTimeout(checkLoading, 500);
          }
        });
      };
      checkLoading();
    });
  }

  /**
   * Extrae resultados de búsqueda desde la tab
   */
  async extractSearchResults(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_SEARCH_RESULTS' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Fallback: retornar estructura básica
          resolve([]);
        } else {
          resolve(response.results || []);
        }
      });
    });
  }

  /**
   * Extrae información detallada de artículos
   */
  async extractArticles(searchResults) {
    const articles = [];
    
    for (const result of searchResults) {
      try {
        const article = await this.fetchArticleDetails(result.url);
        if (article) {
          articles.push(article);
        }
      } catch (error) {
        console.error('[NewsScraper] Error extracting article:', error);
      }
    }
    
    return articles;
  }

  /**
   * Obtiene detalles completos de un artículo
   */
  async fetchArticleDetails(url) {
    // En implementación real, usaría Puppeteer o similar
    // Por ahora, retorna estructura básica
    return {
      url,
      title: 'Artículo pendiente de extracción',
      source: new URL(url).hostname,
      publishedDate: new Date().toISOString(),
      author: 'Desconocido',
      content: '',
      claims: [],
      viralityScore: 0.5
    };
  }

  /**
   * Filtra artículos por calidad y relevancia
   */
  filterArticles(articles) {
    const trustedDomains = [
      'reuters.com',
      'ap.org',
      'bbc.com',
      'cnn.com',
      'nytimes.com',
      'washingtonpost.com',
      'theguardian.com',
      'elpais.com',
      'elmundo.es',
      'bbc.com/mundo'
    ];

    return articles.filter(article => {
      // Filtrar por dominio confiable
      const domain = new URL(article.url).hostname;
      const isTrusted = trustedDomains.some(d => domain.includes(d));
      
      // Filtrar por contenido mínimo
      const hasContent = article.content && article.content.length > 100;
      
      // Filtrar por fecha reciente (últimos 7 días)
      const isRecent = new Date(article.publishedDate) > 
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return (isTrusted || hasContent) && isRecent;
    });
  }

  /**
   * Ordena artículos por score de viralidad
   */
  sortByVirality(articles) {
    return articles.sort((a, b) => {
      // Calcular score basado en múltiples factores
      const scoreA = this.calculateViralityScore(a);
      const scoreB = this.calculateViralityScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calcula score de viralidad
   */
  calculateViralityScore(article) {
    let score = article.viralityScore || 0.5;
    
    // Boost por fuente confiable
    const trustedDomains = ['reuters.com', 'ap.org', 'bbc.com'];
    const domain = new URL(article.url).hostname;
    if (trustedDomains.some(d => domain.includes(d))) {
      score += 0.2;
    }
    
    // Boost por recencia
    const ageInHours = (Date.now() - new Date(article.publishedDate).getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) {
      score += 0.15;
    } else if (ageInHours < 48) {
      score += 0.1;
    }
    
    // Boost por longitud de contenido
    if (article.content && article.content.length > 500) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Detecta si un artículo es potencialmente viral
   */
  detectViralityIndicators(article) {
    const indicators = {
      socialShares: 0,
      commentsCount: 0,
      rapidGrowth: false,
      multipleSources: false
    };
    
    // En implementación real, analizaría redes sociales
    // y menciones en múltiples fuentes
    
    return indicators;
  }
}

export { NewsScraper };
