/**
 * Storybook Stories for ChartSectionComponent
 */

import { Meta, StoryObj } from '@storybook/angular';
import { ChartSectionComponent } from './chart-section.component';
import { TestBuilders } from '../../../testing/test-data-builders';

const meta: Meta<ChartSectionComponent> = {
  title: 'Sections/ChartSection',
  component: ChartSectionComponent,
  tags: ['autodocs'],
  argTypes: {
    section: {
      description: 'Chart section configuration',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<ChartSectionComponent>;

// Line chart - Revenue over time
export const LineChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Revenue Growth')
      .withType('chart')
      .withChartConfig({
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Revenue ($k)',
              data: [65, 78, 90, 81, 96, 105],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: { display: false },
          },
        },
      })
      .build(),
  },
};

// Bar chart - Sales by region
export const BarChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Sales by Region')
      .withType('chart')
      .withChartConfig({
        type: 'bar',
        data: {
          labels: ['North', 'South', 'East', 'West'],
          datasets: [
            {
              label: 'Q4 Sales ($M)',
              data: [12, 19, 8, 15],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        },
      })
      .build(),
  },
};

// Pie chart - Market share
export const PieChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Market Share')
      .withType('chart')
      .withChartConfig({
        type: 'pie',
        data: {
          labels: ['Product A', 'Product B', 'Product C', 'Others'],
          datasets: [
            {
              data: [35, 28, 22, 15],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      })
      .build(),
  },
};

// Doughnut chart - Budget allocation
export const DoughnutChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Budget Allocation')
      .withType('chart')
      .withChartConfig({
        type: 'doughnut',
        data: {
          labels: ['Engineering', 'Marketing', 'Sales', 'Operations'],
          datasets: [
            {
              data: [40, 25, 20, 15],
              backgroundColor: [
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(255, 205, 86, 0.8)',
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' },
          },
        },
      })
      .build(),
  },
};

// Multi-line chart - Comparison
export const MultiLineChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Revenue vs Expenses')
      .withType('chart')
      .withChartConfig({
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Revenue',
              data: [250, 300, 280, 350],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Expenses',
              data: [180, 210, 200, 230],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
        },
      })
      .build(),
  },
};

// Stacked bar chart
export const StackedBarChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Team Performance')
      .withType('chart')
      .withChartConfig({
        type: 'bar',
        data: {
          labels: ['Team A', 'Team B', 'Team C', 'Team D'],
          datasets: [
            {
              label: 'Completed',
              data: [12, 19, 8, 15],
              backgroundColor: 'rgba(75, 192, 192, 0.8)',
            },
            {
              label: 'In Progress',
              data: [5, 7, 4, 6],
              backgroundColor: 'rgba(255, 206, 86, 0.8)',
            },
            {
              label: 'Pending',
              data: [3, 2, 5, 4],
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: true },
            y: { stacked: true },
          },
        },
      })
      .build(),
  },
};

// Area chart
export const AreaChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('User Growth')
      .withType('chart')
      .withChartConfig({
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [
            {
              label: 'Active Users',
              data: [1200, 1900, 2500, 3200, 4100, 5200, 6500, 8000],
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.3)',
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
          },
        },
      })
      .build(),
  },
};

// Small inline chart
export const SmallChart: Story = {
  args: {
    section: TestBuilders.Section.create()
      .withTitle('Quick Stats')
      .withType('chart')
      .withChartConfig({
        type: 'line',
        data: {
          labels: ['', '', '', '', '', ''],
          datasets: [
            {
              data: [4, 6, 3, 8, 5, 7],
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 2,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      })
      .build(),
  },
};



