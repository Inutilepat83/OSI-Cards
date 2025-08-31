import React from 'react';
import { HomePage } from './components/HomePage';
import './styles/globals.css';

export default function App() {
  return (
    <div className="size-full">
      <HomePage documentsFileCount={18} />
    </div>
  );
}