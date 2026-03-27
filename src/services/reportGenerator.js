/**
 * Report Generator Service - Veritas Fact Checking
 * 
 * Servicio para generación de reportes:
 * - Síntesis diaria de información
 * - Exportación a hojas de cálculo
 * - Análisis de tendencias
 */

class ReportGenerator {
  constructor() {
    this.reportTemplates = {
      daily: 'daily_report',
      weekly: 'weekly_report',
      topic: 'topic_report'
    };
  }

  /**
   * Genera reporte diario para un tema
   * @param {string} topic - Tema del reporte
   * @param {Date} date - Fecha del reporte
   * @returns {Promise<Object>} Reporte generado
   */
  async generateDailyReport(topic, date = new Date()) {
    console.log('[ReportGenerator] Generating daily report for:', topic);
    
    try {
      const report = {
        id: this.generateReportId(topic, date),
        type: this.reportTemplates.daily,
        topic,
        date: date.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
        summary: '',
        articles: [],
        statistics: {},
        verdict: '',
        confidence: 0,
        sources: [],
        downloadUrl: null
      };
      
      // Obtener verificaciones del día
      const verifications = await this.getDailyVerifications(topic, date);
      
      // Procesar artículos y verificaciones
      report.articles = this.processArticles(verifications);
      
      // Generar síntesis
      report.summary = await this.generateSummary(report.articles);
      
      // Calcular estadísticas
      report.statistics = this.calculateStatistics(report.articles);
      
      // Determinar veredicto general
      report.verdict = this.determineOverallVerdict(report.articles);
      report.confidence = this.calculateReportConfidence(report.articles);
      
      // Compilar fuentes
      report.sources = this.compileSources(report.articles);
      
      // Preparar para exportación
      report.downloadUrl = await this.prepareForExport(report);
      
      console.log('[ReportGenerator] Daily report generated:', report.id);
      return report;
      
    } catch (error) {
      console.error('[ReportGenerator] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Obtiene verificaciones realizadas en el día
   */
  async getDailyVerifications(topic, date) {
    // En implementación real, obtendría de storage o base de datos
    // Esto es un placeholder
    return [];
  }

  /**
   * Procesa artículos para el reporte
   */
  processArticles(verifications) {
    return verifications.map(v => ({
      id: v.id,
      title: v.article?.title || 'Sin título',
      url: v.article?.url || '',
      source: v.article?.source || 'Desconocida',
      publishedDate: v.article?.publishedDate,
      verifiedAt: v.timestamp,
      verdict: v.verification?.overallVerdict || 'unverified',
      confidence: v.verification?.confidence || 0,
      claims: v.verification?.claims || [],
      contrast: v.verification?.contrast
    }));
  }

  /**
   * Genera síntesis ejecutiva del reporte
   */
  async generateSummary(articles) {
    if (articles.length === 0) {
      return 'No se encontraron artículos para analizar en este período.';
    }
    
    const totalArticles = articles.length;
    const verifiedCount = articles.filter(a => a.verdict !== 'unverified').length;
    const trueCount = articles.filter(a => 
      a.verdict === 'true' || a.verdict === 'mostly_true'
    ).length;
    const falseCount = articles.filter(a => 
      a.verdict === 'false' || a.verdict === 'mostly_false'
    ).length;
    const mixedCount = articles.filter(a => a.verdict === 'mixed').length;
    
    const summary = `
Resumen del análisis de "${articles[0]?.title || 'tema'}":

- Total de artículos analizados: ${totalArticles}
- Artículos verificados: ${verifiedCount} (${Math.round((verifiedCount/totalArticles)*100)}%)
- Información verificada como verdadera: ${trueCount} (${Math.round((trueCount/totalArticles)*100)}%)
- Información contradicha/falsa: ${falseCount} (${Math.round((falseCount/totalArticles)*100)}%)
- Información mixta/parcial: ${mixedCount} (${Math.round((mixedCount/totalArticles)*100)}%)

Fuentes principales consultadas: ${this.getUniqueSources(articles).slice(0, 5).join(', ')}

Nivel de confianza general: ${this.calculateAverageConfidence(articles) > 0.7 ? 'ALTO' : 'MEDIO'}
    `.trim();
    
    return summary;
  }

  /**
   * Calcula estadísticas del reporte
   */
  calculateStatistics(articles) {
    const stats = {
      totalArticles: articles.length,
      byVerdict: {
        true: 0,
        mostly_true: 0,
        mixed: 0,
        mostly_false: 0,
        false: 0,
        unverified: 0
      },
      bySource: {},
      averageConfidence: 0,
      timeRange: {
        earliest: null,
        latest: null
      }
    };
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    for (const article of articles) {
      // Contar por veredicto
      stats.byVerdict[article.verdict] = (stats.byVerdict[article.verdict] || 0) + 1;
      
      // Contar por fuente
      stats.bySource[article.source] = (stats.bySource[article.source] || 0) + 1;
      
      // Calcular confianza promedio
      if (article.confidence > 0) {
        totalConfidence += article.confidence;
        confidenceCount++;
      }
      
      // Actualizar rango de tiempo
      if (article.publishedDate) {
        const pubDate = new Date(article.publishedDate);
        if (!stats.timeRange.earliest || pubDate < stats.timeRange.earliest) {
          stats.timeRange.earliest = pubDate;
        }
        if (!stats.timeRange.latest || pubDate > stats.timeRange.latest) {
          stats.timeRange.latest = pubDate;
        }
      }
    }
    
    stats.averageConfidence = confidenceCount > 0 
      ? totalConfidence / confidenceCount 
      : 0;
    
    return stats;
  }

  /**
   * Determina veredicto general del reporte
   */
  determineOverallVerdict(articles) {
    if (articles.length === 0) {
      return 'SIN INFORMACIÓN SUFICIENTE';
    }
    
    const verdictScores = {
      true: 1.0,
      mostly_true: 0.75,
      mixed: 0.5,
      mostly_false: 0.25,
      false: 0.0,
      unverified: 0.5
    };
    
    let totalScore = 0;
    let weightedCount = 0;
    
    for (const article of articles) {
      const score = verdictScores[article.verdict] || 0.5;
      const weight = article.confidence || 0.5;
      
      totalScore += score * weight;
      weightedCount += weight;
    }
    
    const avgScore = totalScore / weightedCount;
    
    if (avgScore >= 0.85) return 'VERDADERO';
    if (avgScore >= 0.65) return 'MAYORMENTE VERDADERO';
    if (avgScore >= 0.45) return 'MIXTO/EN CONSTRUCCIÓN';
    if (avgScore >= 0.25) return 'MAYORMENTE FALSO';
    return 'FALSO';
  }

  /**
   * Calcula confianza del reporte
   */
  calculateReportConfidence(articles) {
    if (articles.length === 0) return 0;
    
    const totalConfidence = articles.reduce(
      (sum, a) => sum + (a.confidence || 0), 
      0
    );
    
    return totalConfidence / articles.length;
  }

  /**
   * Obtiene fuentes únicas
   */
  getUniqueSources(articles) {
    const sources = new Set(articles.map(a => a.source));
    return Array.from(sources);
  }

  /**
   * Calcula confianza promedio
   */
  calculateAverageConfidence(articles) {
    if (articles.length === 0) return 0;
    
    const total = articles.reduce((sum, a) => sum + (a.confidence || 0), 0);
    return total / articles.length;
  }

  /**
   * Compila lista de fuentes
   */
  compileSources(articles) {
    const sourceMap = new Map();
    
    for (const article of articles) {
      if (!sourceMap.has(article.source)) {
        sourceMap.set(article.source, {
          name: article.source,
          articlesCount: 0,
          articles: []
        });
      }
      
      const source = sourceMap.get(article.source);
      source.articlesCount++;
      source.articles.push({
        title: article.title,
        url: article.url,
        verdict: article.verdict
      });
    }
    
    return Array.from(sourceMap.values())
      .sort((a, b) => b.articlesCount - a.articlesCount);
  }

  /**
   * Prepara reporte para exportación
   */
  async prepareForExport(report) {
    // Generar CSV
    const csvContent = this.generateCSV(report);
    
    // Crear blob y URL temporal
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // En implementación real, guardaría en storage o subiría a Google Sheets
    return url;
  }

  /**
   * Genera contenido CSV del reporte
   */
  generateCSV(report) {
    const headers = [
      'Fecha Reporte',
      'Tema',
      'Título Artículo',
      'Fuente',
      'URL',
      'Fecha Publicación',
      'Veredicto',
      'Confianza',
      'Claims Verificados',
      'Contraste'
    ];
    
    const rows = report.articles.map(article => [
      report.date,
      report.topic,
      this.escapeCSV(article.title),
      this.escapeCSV(article.source),
      article.url,
      article.publishedDate || '',
      article.verdict,
      (article.confidence * 100).toFixed(1) + '%',
      article.claims?.length || 0,
      this.escapeCSV(article.contrast?.summary || '')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Añadir sección de resumen al final
    const summarySection = [
      '',
      '=== RESUMEN DEL REPORTE ===',
      `Tema: ${report.topic}`,
      `Fecha: ${report.date}`,
      `Total Artículos: ${report.statistics.totalArticles}`,
      `Veredicto General: ${report.verdict}`,
      `Confianza: ${(report.confidence * 100).toFixed(1)}%`,
      '',
      'Distribución por Veredicto:',
      ...Object.entries(report.statistics.byVerdict).map(
        ([verdict, count]) => `  - ${verdict}: ${count}`
      ),
      '',
      'Síntesis:',
      report.summary
    ].join('\n');
    
    return csvContent + '\n' + summarySection;
  }

  /**
   * Escapa caracteres especiales para CSV
   */
  escapeCSV(text) {
    if (!text) return '';
    return `"${String(text).replace(/"/g, '""')}"`;
  }

  /**
   * Genera ID único para reporte
   */
  generateReportId(topic, date) {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const topicHash = topic.toLowerCase().replace(/\s+/g, '_').substring(0, 20);
    const random = Math.random().toString(36).substring(2, 7);
    return `report_${dateStr}_${topicHash}_${random}`;
  }

  /**
   * Exporta reporte a Google Sheets
   */
  async exportToGoogleSheets(report) {
    // En implementación real, usaría Google Sheets API
    // Esto requiere autenticación OAuth2
    
    console.log('[ReportGenerator] Would export to Google Sheets:', report.id);
    
    return {
      success: true,
      spreadsheetId: 'placeholder_id',
      url: `https://docs.google.com/spreadsheets/d/placeholder_id`
    };
  }

  /**
   * Genera reporte semanal consolidado
   */
  async generateWeeklyReport(topic, weekStart, weekEnd) {
    // Implementación futura para reportes semanales
    console.log('[ReportGenerator] Weekly report not yet implemented');
    return null;
  }
}

export { ReportGenerator };
