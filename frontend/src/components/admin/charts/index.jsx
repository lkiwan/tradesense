import { useState, useEffect } from 'react'
import Chart from 'react-apexcharts'

// ==================== AREA CHART ====================
export const AreaChart = ({
  series,
  categories,
  height = 350,
  colors = ['#6366f1', '#22c55e'],
  title = '',
  subtitle = '',
  yAxisFormatter = (val) => val,
  showToolbar = false
}) => {
  const options = {
    chart: {
      type: 'area',
      toolbar: { show: showToolbar },
      background: 'transparent',
      fontFamily: 'inherit',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    colors,
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
        formatter: yAxisFormatter
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9ca3af' }
    },
    tooltip: {
      theme: 'dark',
      x: { show: true },
      y: { formatter: yAxisFormatter }
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined,
    subtitle: subtitle ? {
      text: subtitle,
      style: { color: '#9ca3af', fontSize: '12px' }
    } : undefined
  }

  return <Chart options={options} series={series} type="area" height={height} />
}

// ==================== BAR CHART ====================
export const BarChart = ({
  series,
  categories,
  height = 350,
  colors = ['#6366f1'],
  horizontal = false,
  title = '',
  yAxisFormatter = (val) => val,
  showToolbar = false
}) => {
  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: showToolbar },
      background: 'transparent',
      fontFamily: 'inherit'
    },
    colors,
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        columnWidth: '60%',
        distributed: series.length === 1 && categories.length > 1
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
        formatter: yAxisFormatter
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9ca3af' }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: yAxisFormatter }
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined
  }

  return <Chart options={options} series={series} type="bar" height={height} />
}

// ==================== LINE CHART ====================
export const LineChart = ({
  series,
  categories,
  height = 350,
  colors = ['#6366f1', '#22c55e', '#f59e0b'],
  title = '',
  yAxisFormatter = (val) => val,
  showToolbar = false,
  annotations = []
}) => {
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: showToolbar },
      background: 'transparent',
      fontFamily: 'inherit',
      zoom: { enabled: false }
    },
    colors,
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4,
      strokeWidth: 0,
      hover: { size: 6 }
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' },
        formatter: yAxisFormatter
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: '#9ca3af' }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: yAxisFormatter }
    },
    annotations: {
      yaxis: annotations
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined
  }

  return <Chart options={options} series={series} type="line" height={height} />
}

// ==================== DONUT CHART ====================
export const DonutChart = ({
  series,
  labels,
  height = 350,
  colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
  title = '',
  showLegend = true
}) => {
  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      fontFamily: 'inherit'
    },
    colors,
    labels,
    dataLabels: {
      enabled: true,
      style: { fontSize: '12px' },
      dropShadow: { enabled: false }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              color: '#9ca3af',
              fontSize: '14px'
            },
            value: {
              show: true,
              color: '#fff',
              fontSize: '24px',
              fontWeight: 600
            },
            total: {
              show: true,
              label: 'Total',
              color: '#9ca3af',
              fontSize: '14px',
              formatter: (w) => {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString()
              }
            }
          }
        }
      }
    },
    legend: {
      show: showLegend,
      position: 'bottom',
      labels: { colors: '#9ca3af' }
    },
    tooltip: {
      theme: 'dark'
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined
  }

  return <Chart options={options} series={series} type="donut" height={height} />
}

// ==================== RADIAL BAR CHART ====================
export const RadialBarChart = ({
  series,
  labels,
  height = 350,
  colors = ['#6366f1', '#22c55e', '#f59e0b'],
  title = ''
}) => {
  const options = {
    chart: {
      type: 'radialBar',
      background: 'transparent',
      fontFamily: 'inherit'
    },
    colors,
    plotOptions: {
      radialBar: {
        hollow: {
          size: '40%'
        },
        track: {
          background: '#374151',
          strokeWidth: '100%'
        },
        dataLabels: {
          name: {
            show: true,
            color: '#9ca3af',
            fontSize: '12px'
          },
          value: {
            show: true,
            color: '#fff',
            fontSize: '20px',
            fontWeight: 600,
            formatter: (val) => `${val}%`
          }
        }
      }
    },
    labels,
    legend: {
      show: true,
      position: 'bottom',
      labels: { colors: '#9ca3af' }
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined
  }

  return <Chart options={options} series={series} type="radialBar" height={height} />
}

// ==================== HEATMAP CHART ====================
export const HeatmapChart = ({
  series,
  height = 350,
  colors = ['#6366f1'],
  title = ''
}) => {
  const options = {
    chart: {
      type: 'heatmap',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit'
    },
    colors,
    dataLabels: {
      enabled: true,
      style: { colors: ['#fff'], fontSize: '12px' }
    },
    xaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '12px' }
      }
    },
    plotOptions: {
      heatmap: {
        radius: 4,
        enableShades: true,
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 25, color: '#ef4444', name: 'Low' },
            { from: 26, to: 50, color: '#f59e0b', name: 'Medium' },
            { from: 51, to: 75, color: '#22c55e', name: 'Good' },
            { from: 76, to: 100, color: '#6366f1', name: 'Excellent' }
          ]
        }
      }
    },
    tooltip: {
      theme: 'dark'
    },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '16px', fontWeight: 600 }
    } : undefined
  }

  return <Chart options={options} series={series} type="heatmap" height={height} />
}

// ==================== SPARKLINE CHART ====================
export const SparklineChart = ({
  data,
  height = 50,
  width = 120,
  color = '#6366f1',
  type = 'line'
}) => {
  const options = {
    chart: {
      type,
      sparkline: { enabled: true },
      background: 'transparent'
    },
    colors: [color],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: type === 'area' ? {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1
      }
    } : undefined,
    tooltip: {
      theme: 'dark',
      fixed: { enabled: false },
      x: { show: false },
      marker: { show: false }
    }
  }

  const series = [{ data }]

  return <Chart options={options} series={series} type={type} height={height} width={width} />
}

// ==================== REAL-TIME CHART ====================
export const RealTimeChart = ({
  initialData = [],
  height = 200,
  color = '#6366f1',
  maxPoints = 20,
  title = ''
}) => {
  const [data, setData] = useState(initialData)

  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'inherit',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: { speed: 1000 }
      }
    },
    colors: [color],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1
      }
    },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#9ca3af', fontSize: '10px' }
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: { enabled: false },
    title: title ? {
      text: title,
      style: { color: '#fff', fontSize: '14px', fontWeight: 600 }
    } : undefined
  }

  // Method to add new data point
  const addDataPoint = (value) => {
    setData(prev => {
      const newData = [...prev, value]
      if (newData.length > maxPoints) {
        newData.shift()
      }
      return newData
    })
  }

  return (
    <div>
      <Chart
        options={options}
        series={[{ name: 'Value', data }]}
        type="area"
        height={height}
      />
    </div>
  )
}

export default {
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  RadialBarChart,
  HeatmapChart,
  SparklineChart,
  RealTimeChart
}
