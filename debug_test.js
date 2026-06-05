import { render, screen } from '@testing-library/react';
import { InputScreen } from './src/screens/InputScreen';
import React from 'react';
import { useAppStore } from './src/store/appStore';
console.log(useAppStore.getState().history);
