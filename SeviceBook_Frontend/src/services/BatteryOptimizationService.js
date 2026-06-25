import DeviceInfo from 'react-native-device-info';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BatteryOptimizationService {
  async checkAndPrompt() {
    if (Platform.OS !== 'android') return;
    
    try {
      const hasPrompted = await AsyncStorage.getItem('@battery_prompted');
      if (hasPrompted) return;

      const manufacturer = await DeviceInfo.getManufacturer();
      const needsOptimization = ['Xiaomi', 'Oppo', 'Vivo', 'Letv', 'Honor', 'OnePlus', 'Samsung'].some(
        (m) => manufacturer.toLowerCase() === m.toLowerCase()
      );
      
      if (needsOptimization) {
        Alert.alert(
          'Keep Fixigo Running',
          `Your ${manufacturer} device automatically kills background apps to save battery.\n\nTo ensure you don't miss any new booking requests while the app is closed, please go to Settings > Apps > Fixigo and:\n1. Enable "Auto-Start"\n2. Set Battery Saver to "No Restrictions"`,
          [
            { 
              text: 'Remind Me Later', 
              style: 'cancel' 
            },
            { 
              text: 'Open Settings', 
              onPress: async () => {
                await AsyncStorage.setItem('@battery_prompted', 'true');
                Linking.openSettings();
              } 
            }
          ]
        );
      }
    } catch (e) {
      console.log('Battery optimization check failed:', e);
    }
  }
}

export default new BatteryOptimizationService();
