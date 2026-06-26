import BackgroundService from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import { providerAPI } from '../api/provider.api';

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

class BackgroundLocationService {
  constructor() {
    this.isRunning = false;
    this.currentInterval = 30000; // default 30s
  }

  setTrackingMode(mode) {
    switch(mode) {
      case 'idle': this.currentInterval = 30000; break;
      case 'travelling': this.currentInterval = 10000; break;
      case 'active_job': this.currentInterval = 5000; break;
      case 'battery_saver': this.currentInterval = 60000; break;
      default: this.currentInterval = 30000;
    }
  }

  backgroundTask = async (taskDataArguments) => {
    // This loops forever as long as BackgroundService is running
    await new Promise(async (resolve) => {
      while (BackgroundService.isRunning()) {
        Geolocation.getCurrentPosition(
          async (position) => {
            try {
              await providerAPI.heartbeat({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: Date.now()
              });
            } catch (e) {
              console.log("Heartbeat failed", e?.response?.data || e.message);
            }
          },
          (error) => console.log("Background GPS Error: ", error),
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
        );

        await sleep(this.currentInterval);
      }
    });
  };

  async start() {
    if (this.isRunning) return;
    
    const options = {
      taskName: 'FixigoProviderTracking',
      taskTitle: '🟢 Online',
      taskDesc: 'Looking for nearby bookings...',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#4F46E5', // Primary blue
      parameters: { delay: this.currentInterval },
      foregroundServiceType: ['location'],
    };

    try {
      await BackgroundService.start(this.backgroundTask, options);
      this.isRunning = true;
    } catch (e) {
      console.log("Error starting background service: ", e);
    }
  }

  async stop() {
    if (!this.isRunning) return;
    await BackgroundService.stop();
    this.isRunning = false;
  }
}

export default new BackgroundLocationService();
