/**
 * Topic Manager Service - Veritas Fact Checking
 * 
 * Servicio para gestión de temas de investigación:
 * - Validación de temas
 * - Seguimiento de estado
 * - Historial de investigaciones
 */

class TopicManager {
  constructor() {
    this.activeTopics = new Map();
    this.topicHistory = [];
    this.maxConcurrentTopics = 3;
  }

  /**
   * Valida un tema antes de iniciar investigación
   * @param {string} topic - Tema a validar
   * @returns {Object} Resultado de validación
   */
  validateTopic(topic) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Verificar longitud mínima
    if (!topic || topic.trim().length < 3) {
      validation.isValid = false;
      validation.errors.push('El tema debe tener al menos 3 caracteres');
    }

    // Verificar longitud máxima
    if (topic.length > 200) {
      validation.isValid = false;
      validation.errors.push('El tema no puede exceder 200 caracteres');
    }

    // Verificar caracteres inválidos
    const invalidChars = /[<>{}|\\^`]/g;
    if (invalidChars.test(topic)) {
      validation.isValid = false;
      validation.errors.push('El tema contiene caracteres inválidos');
    }

    // Verificar si es demasiado genérico
    const genericTerms = [
      'noticias',
      'news',
      'actualidad',
      'información',
      'tema',
      'asunto'
    ];

    if (genericTerms.includes(topic.toLowerCase().trim())) {
      validation.warnings.push(
        'El tema es muy genérico. Considere ser más específico para mejores resultados.'
      );
      validation.suggestions.push(
        'Ejemplo: en lugar de "noticias", pruebe con "elecciones presidenciales 2024"'
      );
    }

    // Verificar si ya está siendo investigado
    if (this.activeTopics.has(topic.toLowerCase())) {
      validation.isValid = false;
      validation.errors.push('Este tema ya está siendo investigado activamente');
    }

    // Verificar límite de temas concurrentes
    if (this.activeTopics.size >= this.maxConcurrentTopics) {
      validation.isValid = false;
      validation.errors.push(
        `Se ha alcanzado el límite máximo de ${this.maxConcurrentTopics} temas concurrentes`
      );
    }

    return validation;
  }

  /**
   * Inicia un nuevo tema de investigación
   */
  async startTopic(topic) {
    const validation = this.validateTopic(topic);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    const normalizedTopic = topic.toLowerCase().trim();
    const topicData = {
      id: this.generateTopicId(normalizedTopic),
      name: topic,
      normalized: normalizedTopic,
      status: 'active',
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      articlesFound: 0,
      verificationsCompleted: 0,
      reportsGenerated: 0,
      checksPerformed: 0
    };

    this.activeTopics.set(normalizedTopic, topicData);
    console.log('[TopicManager] Topic started:', topicData.id);

    return topicData;
  }

  /**
   * Detiene un tema de investigación
   */
  async stopTopic(topicName) {
    const normalizedTopic = topicName.toLowerCase().trim();
    const topicData = this.activeTopics.get(normalizedTopic);

    if (!topicData) {
      throw new Error('Tema no encontrado');
    }

    topicData.status = 'stopped';
    topicData.endTime = new Date().toISOString();
    topicData.lastUpdate = new Date().toISOString();

    // Mover a historial
    this.topicHistory.push(topicData);
    this.activeTopics.delete(normalizedTopic);

    console.log('[TopicManager] Topic stopped:', topicData.id);

    return topicData;
  }

  /**
   * Obtiene información de un tema activo
   */
  getTopic(topicName) {
    const normalizedTopic = topicName.toLowerCase().trim();
    return this.activeTopics.get(normalizedTopic) || null;
  }

  /**
   * Lista todos los temas activos
   */
  getActiveTopics() {
    return Array.from(this.activeTopics.values());
  }

  /**
   * Actualiza estadísticas de un tema
   */
  updateTopicStats(topicName, updates) {
    const normalizedTopic = topicName.toLowerCase().trim();
    const topicData = this.activeTopics.get(normalizedTopic);

    if (!topicData) {
      throw new Error('Tema no encontrado');
    }

    Object.assign(topicData, updates, {
      lastUpdate: new Date().toISOString()
    });

    this.activeTopics.set(normalizedTopic, topicData);
  }

  /**
   * Incrementa contador de artículos encontrados
   */
  incrementArticlesCount(topicName, count = 1) {
    const topicData = this.getTopic(topicName);
    if (topicData) {
      topicData.articlesFound += count;
      this.updateTopicStats(topicName, { articlesFound: topicData.articlesFound });
    }
  }

  /**
   * Incrementa contador de verificaciones completadas
   */
  incrementVerificationsCount(topicName, count = 1) {
    const topicData = this.getTopic(topicName);
    if (topicData) {
      topicData.verificationsCompleted += count;
      this.updateTopicStats(topicName, { verificationsCompleted: topicData.verificationsCompleted });
    }
  }

  /**
   * Incrementa contador de chequeos realizados
   */
  incrementChecksCount(topicName, count = 1) {
    const topicData = this.getTopic(topicName);
    if (topicData) {
      topicData.checksPerformed += count;
      this.updateTopicStats(topicName, { checksPerformed: topicData.checksPerformed });
    }
  }

  /**
   * Obtiene historial de temas investigados
   */
  getTopicHistory(limit = 50) {
    return this.topicHistory.slice(-limit);
  }

  /**
   * Busca temas en historial por nombre
   */
  searchTopicHistory(query) {
    const normalizedQuery = query.toLowerCase();
    return this.topicHistory.filter(topic =>
      topic.name.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Obtiene estadísticas generales
   */
  getStatistics() {
    return {
      activeTopicsCount: this.activeTopics.size,
      totalTopicsInvestigated: this.topicHistory.length,
      maxConcurrentReached: Math.max(
        ...this.topicHistory.map((_, idx) => 
          this.topicHistory.slice(0, idx + 1).filter(
            t => t.status === 'active'
          ).length
        ),
        this.activeTopics.size
      )
    };
  }

  /**
   * Limpia temas inactivos del historial
   */
  cleanupHistory(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const initialLength = this.topicHistory.length;
    this.topicHistory = this.topicHistory.filter(topic =>
      new Date(topic.endTime) > cutoffDate
    );

    const removed = initialLength - this.topicHistory.length;
    console.log(`[TopicManager] Cleaned up ${removed} old topics from history`);

    return removed;
  }

  /**
   * Genera ID único para tema
   */
  generateTopicId(topicName) {
    const timestamp = Date.now();
    const hash = this.simpleHash(topicName);
    return `topic_${timestamp}_${hash}`;
  }

  /**
   * Función simple de hashing para nombres de tema
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Exporta configuración de temas
   */
  exportConfiguration() {
    return {
      activeTopics: Array.from(this.activeTopics.entries()),
      history: this.topicHistory,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importa configuración de temas
   */
  importConfiguration(config) {
    try {
      if (config.activeTopics) {
        this.activeTopics = new Map(config.activeTopics);
      }
      if (config.history) {
        this.topicHistory = config.history;
      }
      console.log('[TopicManager] Configuration imported successfully');
      return true;
    } catch (error) {
      console.error('[TopicManager] Error importing configuration:', error);
      return false;
    }
  }
}

export { TopicManager };
