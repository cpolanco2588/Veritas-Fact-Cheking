/**
 * Storage Manager - Veritas Fact Checking
 * 
 * Gestiona el almacenamiento de datos de la extensión:
 * - Temas activos
 * - Verificaciones realizadas
 * - Reportes generados
 */

class StorageManager {
  constructor() {
    this.storage = chrome.storage.local;
  }

  async initialize() {
    console.log('[Storage] Initializing storage manager');
    // Ensure storage is accessible
    return new Promise((resolve) => {
      this.storage.get(null, (items) => {
        console.log('[Storage] Storage initialized with', Object.keys(items).length, 'items');
        resolve();
      });
    });
  }

  async saveActiveTopic(topic) {
    return new Promise((resolve, reject) => {
      this.storage.set({ activeTopic: topic }, (error) => {
        if (error) {
          console.error('[Storage] Error saving active topic:', error);
          reject(error);
        } else {
          console.log('[Storage] Active topic saved:', topic.name);
          resolve();
        }
      });
    });
  }

  async getActiveTopic() {
    return new Promise((resolve, reject) => {
      this.storage.get('activeTopic', (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result.activeTopic || null);
        }
      });
    });
  }

  async clearActiveTopic() {
    return new Promise((resolve, reject) => {
      this.storage.remove('activeTopic', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async saveVerification(verification) {
    const id = `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    verification.id = id;

    return new Promise((resolve, reject) => {
      this.storage.get('verifications', (result) => {
        const verifications = result.verifications || [];
        verifications.push(verification);

        this.storage.set({ verifications }, (error) => {
          if (error) {
            reject(error);
          } else {
            console.log('[Storage] Verification saved:', id);
            resolve(verification);
          }
        });
      });
    });
  }

  async getVerificationsByTopic(topicName) {
    return new Promise((resolve, reject) => {
      this.storage.get('verifications', (result) => {
        const verifications = result.verifications || [];
        const filtered = verifications.filter(v => v.topic === topicName);
        resolve(filtered);
      });
    });
  }

  async getAllVerifications() {
    return new Promise((resolve, reject) => {
      this.storage.get('verifications', (result) => {
        resolve(result.verifications || []);
      });
    });
  }

  async saveReport(report) {
    const id = `report_${report.date}_${Math.random().toString(36).substr(2, 9)}`;
    report.id = id;

    return new Promise((resolve, reject) => {
      this.storage.get('reports', (result) => {
        const reports = result.reports || [];
        reports.unshift(report); // Add to beginning

        // Keep only last 100 reports
        if (reports.length > 100) {
          reports.splice(100);
        }

        this.storage.set({ reports }, (error) => {
          if (error) {
            reject(error);
          } else {
            console.log('[Storage] Report saved:', id);
            resolve(report);
          }
        });
      });
    });
  }

  async getReports() {
    return new Promise((resolve, reject) => {
      this.storage.get('reports', (result) => {
        resolve(result.reports || []);
      });
    });
  }

  async getReportById(id) {
    const reports = await this.getReports();
    return reports.find(r => r.id === id) || null;
  }

  async exportReportToCSV(report) {
    // Generate CSV content from report
    const headers = [
      'Fecha',
      'Tema',
      'Título',
      'Fuente',
      'URL',
      'Veredicto',
      'Confianza',
      'Contraste'
    ];

    const rows = report.articles.map(article => [
      report.date,
      report.topic,
      article.title,
      article.source,
      article.url,
      article.verdict,
      article.confidence,
      article.contrast
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  async downloadReport(report) {
    const csvContent = await this.exportReportToCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const filename = `veritas_${report.topic.replace(/\s+/g, '_')}_${report.date}.csv`;
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async clearAllData() {
    return new Promise((resolve, reject) => {
      this.storage.clear((error) => {
        if (error) {
          reject(error);
        } else {
          console.log('[Storage] All data cleared');
          resolve();
        }
      });
    });
  }

  async getStorageStats() {
    return new Promise((resolve, reject) => {
      this.storage.get(null, (items) => {
        const stats = {
          totalItems: Object.keys(items).length,
          verificationsCount: (items.verifications || []).length,
          reportsCount: (items.reports || []).length,
          hasActiveTopic: !!items.activeTopic
        };
        resolve(stats);
      });
    });
  }
}

export { StorageManager };
