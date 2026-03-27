/**
 * Veritas Fact Checking - Background Service Worker
 * 
 * Maneja la lógica principal del agente autónomo de verificación:
 * - Gestión de temas de investigación
 * - Búsqueda continua de noticias virales
 * - Verificación en múltiples fuentes
 * - Generación de reportes diarios
 */

import { TopicManager } from '@services/topicManager.js';
import { NewsScraper } from '@services/newsScraper.js';
import { FactChecker } from '@services/factChecker.js';
import { ReportGenerator } from '@services/reportGenerator.js';
import { StorageManager } from '@storage/storageManager.js';

class VeritasAgent {
  constructor() {
    this.topicManager = new TopicManager();
    this.newsScraper = new NewsScraper();
    this.factChecker = new FactChecker();
    this.reportGenerator = new ReportGenerator();
    this.storageManager = new StorageManager();
    this.activeTopic = null;
    this.isRunning = false;
    this.checkInterval = null;
  }

  async initialize() {
    console.log('[Veritas] Agent initialized');
    await this.storageManager.initialize();
    this.setupMessageListeners();
    this.setupAlarmListeners();
    await this.resumeActiveTopic();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });
  }

  setupAlarmListeners() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'veritas-check') {
        this.performPeriodicCheck();
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'START_TOPIC':
          await this.startTopic(message.topic);
          sendResponse({ success: true, message: 'Topic started' });
          break;

        case 'STOP_TOPIC':
          await this.stopTopic();
          sendResponse({ success: true, message: 'Topic stopped' });
          break;

        case 'GET_STATUS':
          const status = await this.getStatus();
          sendResponse({ success: true, data: status });
          break;

        case 'GET_REPORTS':
          const reports = await this.storageManager.getReports();
          sendResponse({ success: true, data: reports });
          break;

        default:
          sendResponse({ success: false, message: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Veritas] Error handling message:', error);
      sendResponse({ success: false, message: error.message });
    }
  }

  async startTopic(topic) {
    console.log('[Veritas] Starting topic:', topic);
    
    await this.stopTopic(); // Stop any existing topic
    
    this.activeTopic = {
      name: topic,
      startTime: new Date().toISOString(),
      status: 'active',
      articlesFound: 0,
      verificationsCompleted: 0
    };

    await this.storageManager.saveActiveTopic(this.activeTopic);
    this.isRunning = true;
    
    // Start continuous monitoring
    await this.performInitialSearch();
    this.scheduleNextCheck();
  }

  async stopTopic() {
    console.log('[Veritas] Stopping current topic');
    
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.activeTopic) {
      this.activeTopic.status = 'stopped';
      this.activeTopic.endTime = new Date().toISOString();
      await this.storageManager.saveActiveTopic(this.activeTopic);
      
      // Generate final report
      await this.generateDailyReport();
    }

    this.isRunning = false;
    this.activeTopic = null;
  }

  async resumeActiveTopic() {
    const activeTopic = await this.storageManager.getActiveTopic();
    if (activeTopic && activeTopic.status === 'active') {
      console.log('[Veritas] Resuming active topic:', activeTopic.name);
      this.activeTopic = activeTopic;
      this.isRunning = true;
      this.scheduleNextCheck();
    }
  }

  async performInitialSearch() {
    if (!this.activeTopic) return;

    try {
      console.log('[Veritas] Performing initial search for:', this.activeTopic.name);
      
      // Search for viral news
      const articles = await this.newsScraper.searchNews(this.activeTopic.name);
      this.activeTopic.articlesFound += articles.length;
      
      // Verify each article
      for (const article of articles) {
        const verification = await this.factChecker.verifyArticle(article);
        this.activeTopic.verificationsCompleted++;
        
        await this.storageManager.saveVerification({
          topic: this.activeTopic.name,
          article,
          verification,
          timestamp: new Date().toISOString()
        });
      }

      await this.storageManager.saveActiveTopic(this.activeTopic);
      
      // Send update to popup
      this.sendStatusUpdate();
      
    } catch (error) {
      console.error('[Veritas] Error in initial search:', error);
    }
  }

  async performPeriodicCheck() {
    if (!this.isRunning || !this.activeTopic) return;
    
    console.log('[Veritas] Performing periodic check');
    await this.performInitialSearch();
    this.scheduleNextCheck();
  }

  scheduleNextCheck() {
    // Check every 5 minutes while extension is active
    this.checkInterval = setTimeout(() => {
      this.performPeriodicCheck();
    }, 5 * 60 * 1000);
  }

  async generateDailyReport() {
    if (!this.activeTopic) return;

    try {
      const report = await this.reportGenerator.generateDailyReport(
        this.activeTopic.name,
        new Date()
      );
      
      await this.storageManager.saveReport(report);
      console.log('[Veritas] Daily report generated:', report.id);
      
    } catch (error) {
      console.error('[Veritas] Error generating report:', error);
    }
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      activeTopic: this.activeTopic,
      lastUpdate: new Date().toISOString()
    };
  }

  sendStatusUpdate() {
    chrome.runtime.sendMessage({
      type: 'STATUS_UPDATE',
      data: {
        isRunning: this.isRunning,
        activeTopic: this.activeTopic
      }
    }).catch(() => {
      // Popup may not be open, ignore error
    });
  }
}

// Initialize agent when service worker starts
const agent = new VeritasAgent();
agent.initialize();

export { VeritasAgent };
