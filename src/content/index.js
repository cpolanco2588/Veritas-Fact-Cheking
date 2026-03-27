/**
 * Content Script - Veritas Fact Checking
 * 
 * Se inyecta en páginas web para:
 * - Extraer información de artículos
 * - Identificar fuentes y autores
 * - Detectar claims verificables
 */

class ContentScript {
  constructor() {
    this.articleData = null;
  }

  initialize() {
    console.log('[Veritas] Content script loaded');
    this.detectArticle();
    this.setupMessageListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });
  }

  async handleMessage(message, sendResponse) {
    try {
      switch (message.type) {
        case 'EXTRACT_ARTICLE':
          this.articleData = this.extractArticleInfo();
          sendResponse({ success: true, data: this.articleData });
          break;

        case 'GET_PAGE_INFO':
          const pageInfo = this.getPageInfo();
          sendResponse({ success: true, data: pageInfo });
          break;

        default:
          sendResponse({ success: false, message: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Veritas] Error in content script:', error);
      sendResponse({ success: false, message: error.message });
    }
  }

  detectArticle() {
    // Detect if current page is a news article
    const articleSelectors = [
      'article',
      '.article',
      '.news-article',
      '[itemtype="http://schema.org/NewsArticle"]',
      '[itemtype="http://schema.org/Article"]'
    ];

    for (const selector of articleSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('[Veritas] Article detected');
        return true;
      }
    }
    return false;
  }

  extractArticleInfo() {
    const info = {
      url: window.location.href,
      title: this.extractTitle(),
      author: this.extractAuthor(),
      publishedDate: this.extractPublishedDate(),
      source: this.extractSource(),
      content: this.extractContent(),
      claims: this.extractClaims()
    };

    return info;
  }

  extractTitle() {
    // Try multiple selectors for title
    const selectors = [
      'h1',
      '.article-title',
      '.headline',
      '[property="headline"]',
      'title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return document.title;
  }

  extractAuthor() {
    const selectors = [
      '[rel="author"]',
      '.author',
      '.byline',
      '[name="author"]',
      'meta[name="author"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.content || element.textContent.trim();
      }
    }
    return 'Unknown';
  }

  extractPublishedDate() {
    const selectors = [
      '[itemprop="datePublished"]',
      'time[datetime]',
      '.published-date',
      'meta[name="pubdate"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.datetime || element.content || element.textContent;
      }
    }
    return new Date().toISOString();
  }

  extractSource() {
    const selectors = [
      '[itemprop="publisher"]',
      '.source',
      '.publication',
      'meta[name="application-name"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.content || element.textContent.trim();
      }
    }
    return window.location.hostname;
  }

  extractContent() {
    const selectors = [
      '[itemprop="articleBody"]',
      '.article-body',
      '.content',
      '.article-content'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }

    // Fallback: extract main text content
    const paragraphs = document.querySelectorAll('p');
    return Array.from(paragraphs)
      .map(p => p.textContent.trim())
      .join('\n\n')
      .slice(0, 5000); // Limit length
  }

  extractClaims() {
    // Extract sentences that appear to be factual claims
    const content = this.extractContent();
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    
    const claimIndicators = [
      'according to',
      'reports show',
      'studies indicate',
      'experts say',
      'data suggests',
      'confirmed',
      'revealed',
      'announced'
    ];

    const claims = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return claimIndicators.some(indicator => lower.includes(indicator));
    });

    return claims.slice(0, 10); // Limit to top 10 claims
  }

  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      description: this.getMetaDescription(),
      keywords: this.getMetaKeywords(),
      isArticle: this.detectArticle()
    };
  }

  getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]');
    return meta ? meta.content : '';
  }

  getMetaKeywords() {
    const meta = document.querySelector('meta[name="keywords"]');
    return meta ? meta.content : '';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const contentScript = new ContentScript();
    contentScript.initialize();
  });
} else {
  const contentScript = new ContentScript();
  contentScript.initialize();
}

export { ContentScript };
