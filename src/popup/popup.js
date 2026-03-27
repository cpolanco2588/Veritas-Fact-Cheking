/**
 * Popup Script - Veritas Fact Checking
 * 
 * Maneja la interfaz de usuario del popup:
 * - Input de temas
 * - Visualización de estado
 * - Control de investigación
 * - Listado de reportes
 */

class PopupManager {
  constructor() {
    this.elements = {};
    this.currentState = null;
  }

  initialize() {
    this.cacheElements();
    this.attachEventListeners();
    this.loadCurrentState();
    this.setupMessageListener();
  }

  cacheElements() {
    this.elements = {
      topicInput: document.getElementById('topic-input'),
      startBtn: document.getElementById('start-btn'),
      stopBtn: document.getElementById('stop-btn'),
      topicSection: document.getElementById('topic-section'),
      activeTopicSection: document.getElementById('active-topic-section'),
      activeTopicName: document.getElementById('active-topic-name'),
      statusText: document.getElementById('status-text'),
      articlesCount: document.getElementById('articles-count'),
      verifiedCount: document.getElementById('verified-count'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      reportsList: document.getElementById('reports-list'),
      viewAllBtn: document.getElementById('view-all-btn')
    };
  }

  attachEventListeners() {
    this.elements.startBtn.addEventListener('click', () => this.startTopic());
    this.elements.stopBtn.addEventListener('click', () => this.stopTopic());
    this.elements.topicInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startTopic();
    });
    this.elements.viewAllBtn.addEventListener('click', () => this.viewAllReports());
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'STATUS_UPDATE') {
        this.updateUI(message.data);
      }
    });
  }

  async loadCurrentState() {
    try {
      const response = await this.sendMessage({ type: 'GET_STATUS' });
      if (response.success) {
        this.updateUI(response.data);
      }
    } catch (error) {
      console.error('[Popup] Error loading state:', error);
    }
  }

  async startTopic() {
    const topic = this.elements.topicInput.value.trim();
    if (!topic) {
      this.showError('Por favor ingresa un tema');
      return;
    }

    try {
      this.setLoading(true);
      const response = await this.sendMessage({ 
        type: 'START_TOPIC', 
        topic 
      });

      if (response.success) {
        this.elements.topicInput.value = '';
        this.loadCurrentState();
      } else {
        this.showError(response.message);
      }
    } catch (error) {
      this.showError('Error al iniciar investigación: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  async stopTopic() {
    try {
      this.setLoading(true);
      const response = await this.sendMessage({ type: 'STOP_TOPIC' });

      if (response.success) {
        this.loadCurrentState();
      } else {
        this.showError(response.message);
      }
    } catch (error) {
      this.showError('Error al detener investigación: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  updateUI(state) {
    this.currentState = state;

    if (state.isRunning && state.activeTopic) {
      this.showActiveTopic(state.activeTopic);
    } else {
      this.showIdleState();
    }

    this.updateProgress(state);
  }

  showActiveTopic(topic) {
    this.elements.topicSection.classList.add('hidden');
    this.elements.activeTopicSection.classList.remove('hidden');
    
    this.elements.activeTopicName.textContent = topic.name;
    this.elements.articlesCount.textContent = topic.articlesFound || 0;
    this.elements.verifiedCount.textContent = topic.verificationsCompleted || 0;
    
    if (topic.status === 'active') {
      this.elements.statusText.textContent = 'Investigando...';
      this.elements.statusText.className = 'status-text active';
    } else {
      this.elements.statusText.textContent = 'Detenido';
      this.elements.statusText.className = 'status-text stopped';
    }
  }

  showIdleState() {
    this.elements.topicSection.classList.remove('hidden');
    this.elements.activeTopicSection.classList.add('hidden');
  }

  updateProgress(state) {
    if (!state.isRunning || !state.activeTopic) {
      this.elements.progressFill.style.width = '0%';
      this.elements.progressText.textContent = 'Esperando inicio...';
      return;
    }

    const total = state.activeTopic.articlesFound || 1;
    const completed = state.activeTopic.verificationsCompleted || 0;
    const percentage = Math.min((completed / total) * 100, 100);

    this.elements.progressFill.style.width = `${percentage}%`;
    this.elements.progressText.textContent = 
      `${completed} de ${total} artículos verificados`;
  }

  async loadReports() {
    try {
      const response = await this.sendMessage({ type: 'GET_REPORTS' });
      if (response.success && response.data.length > 0) {
        this.renderReports(response.data);
      } else {
        this.elements.reportsList.innerHTML = 
          '<p class="empty-message">No hay reportes recientes</p>';
      }
    } catch (error) {
      console.error('[Popup] Error loading reports:', error);
    }
  }

  renderReports(reports) {
    const html = reports.slice(0, 5).map(report => `
      <div class="report-item">
        <div class="report-title">${report.topic}</div>
        <div class="report-meta">
          <span>${new Date(report.date).toLocaleDateString()}</span>
          <span>${report.articlesCount} artículos</span>
        </div>
        <div class="report-verdict ${report.verdict.toLowerCase()}">
          ${report.verdict}
        </div>
      </div>
    `).join('');

    this.elements.reportsList.innerHTML = html;
  }

  viewAllReports() {
    // TODO: Open reports page or download all reports
    alert('Funcionalidad en desarrollo: Ver todos los reportes');
  }

  setLoading(isLoading) {
    this.elements.startBtn.disabled = isLoading;
    this.elements.stopBtn.disabled = isLoading;
    this.elements.topicInput.disabled = isLoading;
    
    if (isLoading) {
      this.elements.startBtn.textContent = 'Iniciando...';
    } else {
      this.elements.startBtn.textContent = 'Iniciar Investigación';
    }
  }

  showError(message) {
    // TODO: Implement proper error toast/notification
    alert(message);
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popupManager = new PopupManager();
  popupManager.initialize();
});

export { PopupManager };
