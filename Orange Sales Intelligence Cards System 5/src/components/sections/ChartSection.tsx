import React from 'react';
import { AISectionConfig, ChartField } from '../../types';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';

interface ChartSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as ChartField[] || [];
  const chartType = section.chartType || 'bar';

  const getChartIcon = () => {
    switch (chartType) {
      case 'pie':
      case 'doughnut':
        return <PieChart className="w-5 h-5 text-primary" />;
      case 'line':
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case 'bar':
      default:
        return <BarChart3 className="w-5 h-5 text-primary" />;
    }
  };

  const maxValue = Math.max(...fields.map(f => f.value));
  
  const getBarWidth = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const getColor = (field: ChartField, index: number) => {
    if (field.color) return field.color;
    
    const colors = ['#FF7900', '#FF9933', '#CC5F00', '#FFE6CC', '#FF4500'];
    return colors[index % colors.length];
  };

  const handleFieldClick = (field: ChartField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      fieldLabel: field.label,
      action: 'click',
      value: field.value
    });
  };

  const renderBarChart = () => (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const color = getColor(field, index);
        const width = getBarWidth(field.value);
        
        return (
          <div
            key={`${field.label}-${index}`}
            className="group cursor-pointer"
            onClick={() => handleFieldClick(field)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {field.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {field.value.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}40`
                }}
              />
            </div>
            {field.category && (
              <div className="text-xs text-muted-foreground mt-1">
                Category: {field.category}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPieChart = () => {
    const total = fields.reduce((sum, field) => sum + field.value, 0);
    let cumulativeAngle = 0;

    return (
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Pie Chart SVG */}
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {fields.map((field, index) => {
              const percentage = field.value / total;
              const angle = percentage * 360;
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + angle;
              
              const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              const color = getColor(field, index);
              
              cumulativeAngle += angle;
              
              return (
                <path
                  key={index}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={color}
                  className="hover:brightness-110 cursor-pointer transition-all duration-300"
                  onClick={() => handleFieldClick(field)}
                  style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
                />
              );
            })}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-2">
          {fields.map((field, index) => {
            const color = getColor(field, index);
            const percentage = ((field.value / total) * 100).toFixed(1);
            
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded hover:bg-card/30 cursor-pointer transition-colors"
                onClick={() => handleFieldClick(field)}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{field.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {field.value.toLocaleString()} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {getChartIcon()}
        <h3 className="text-xl font-semibold text-foreground">
          {section.title}
        </h3>
        
      </div>

      {fields.length > 0 ? (
        chartType === 'pie' || chartType === 'doughnut' ? renderPieChart() : renderBarChart()
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No chart data available</p>
        </div>
      )}
    </div>
  );
};