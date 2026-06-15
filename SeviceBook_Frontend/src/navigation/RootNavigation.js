import { createRef } from 'react';

export const navigationRef = createRef();

export const resetToLogin = () => {
  if (navigationRef.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};