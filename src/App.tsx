import React from 'react';
import { ConfigProvider, theme } from 'antd';
import MapContainer from './components/Map/MapContainer';
import TimelineSlider from './components/Timeline/TimelineSlider';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';
import './styles/globals.css';

const { darkAlgorithm } = theme;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: darkAlgorithm,
        token: {
          colorPrimary: '#722ed1',
        },
      }}
    >
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-icon">📊</span>
              Analytics Dashboard
            </h1>
          </div>
        </header>

        <div className="timeline-container">
          <TimelineSlider />
        </div>

        <div className="main-content">
          <div className="map-section">
            <MapContainer />
          </div>
          <div className="sidebar-section">
            <Sidebar />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default App;
