import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import './TabLayout.css';

// Tab Interface für allgemeine Verwendung
export interface TabLayoutItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

// Time Range Interface
export interface TimeRange {
  value: string;
  label: string;
}

// Counter Selection Interface  
export interface CounterSelection {
  id: string;
  label: string;
  title?: string;
  options: Array<{
    id: string;
    label: string;
  }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
}

// Tab Navigation Props
interface TabNavigationProps {
  tabs: TabLayoutItem[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  timeRanges?: TimeRange[];
  selectedTimeRange?: string;
  onTimeRangeChange?: (value: string) => void;
  className?: string;
}

// Counter Selection Props
interface CounterSelectionProps {
  selections: CounterSelection[];
  className?: string;
}

// Tab Navigation Component
export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTabIndex,
  onTabChange,
  timeRanges,
  selectedTimeRange,
  onTimeRangeChange,
  className = ""
}) => {
  return (
    <div className={`tab-navigation-container ${className}`}>
      <div className="tab-navigation-header">
        <div className="tab-container">
          {tabs.map((tab, index) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(index)}
              className={`tab-button ${
                activeTabIndex === index ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
        
        {timeRanges && selectedTimeRange && onTimeRangeChange && (
          <div className="time-range-selector">
            <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

// Counter Selection Component
export const CounterSelectionGroup: React.FC<CounterSelectionProps> = ({
  selections,
  className = ""
}) => {
  return (
    <div className={className}>
      {selections.map((selection) => (
        <div key={selection.id} className="counter-selection-container">
          <h4 className="counter-selection-title">
            {selection.title || selection.label}
          </h4>
          <div className="counter-selection-buttons">
            {selection.options.map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                size="sm"
                onClick={() => selection.onSelect(option.id)}
                className={`counter-button ${
                  selection.selectedValue === option.id 
                    ? 'counter-button-active' 
                    : 'counter-button-inactive'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility Component für Grafana iframe Container
interface GrafanaIframeContainerProps {
  src: string;
  title: string;
  height?: string;
  className?: string;
  onLoad?: () => void;
}

export const GrafanaIframeContainer: React.FC<GrafanaIframeContainerProps> = ({
  src,
  title,
  height = "250px",
  className = "",
  onLoad
}) => {
  return (
    <div 
      className={`grafana-iframe-container ${className}`} 
      style={{ height }}
    >
      <iframe
        src={src}
        className="grafana-iframe"
        title={title}
        loading="lazy"
        onLoad={onLoad}
      />
    </div>
  );
};

// Split Layout für zwei nebeneinander liegende Panels
interface GrafanaSplitLayoutProps {
  leftSrc: string;
  rightSrc: string;
  leftTitle: string;
  rightTitle: string;
  leftWidth?: string;
  height?: string;
  className?: string;
  onLeftLoad?: () => void;
  onRightLoad?: () => void;
}

export const GrafanaSplitLayout: React.FC<GrafanaSplitLayoutProps> = ({
  leftSrc,
  rightSrc,
  leftTitle,
  rightTitle,
  leftWidth = "180px",
  height = "250px",
  className = "",
  onLeftLoad,
  onRightLoad
}) => {
  return (
    <div 
      className={`grafana-split-container ${className}`}
      style={{ height }}
    >
      <div 
        className="grafana-panel-left"
        style={{ width: leftWidth }}
      >
        <iframe
          src={leftSrc}
          className="grafana-iframe"
          title={leftTitle}
          loading="lazy"
          onLoad={onLeftLoad}
        />
      </div>
      <div className="grafana-panel-right">
        <iframe
          src={rightSrc}
          className="grafana-iframe"
          title={rightTitle}
          loading="lazy"
          onLoad={onRightLoad}
        />
      </div>
    </div>
  );
};

// Standard Time Ranges Export
export const STANDARD_TIME_RANGES: TimeRange[] = [
  { value: "now-1h", label: "Letzte Stunde" },
  { value: "now-6h", label: "Letzte 6 Stunden" },
  { value: "now-12h", label: "Letzte 12 Stunden" },
  { value: "now-24h", label: "Letzte 24 Stunden" },
  { value: "now-3d", label: "Letzte 3 Tage" },
  { value: "now-7d", label: "Letzte 7 Tage" },
  { value: "now-30d", label: "Letzte 30 Tage" },
];