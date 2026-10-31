import * as echarts from 'echarts'

export const gauge = (title:string, val:string, backgroundColor:any) => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 1000,
    height: 1000,
  })
  const option = {
    series: [
      {
        type: 'gauge',
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.8, '#1f78b4'],
              [0.9, '#dfdf22'],
              [1, '#e31a1c'],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4,
          },
        },
        axisLabel: {
          color: 'inherit',
          distance: 40,
          fontSize: 20,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: 'inherit',
        },
        data: [
          {
            value: val,
            name: title,
            title: {
              color: isDark() ? '#fff' : '#333',
              fontSize: 40,
              offsetCenter: [0, '60%'],
            },
          },
        ],
      },
    ],
  }
  chart.setOption(option)
  return chart.getDataURL({ backgroundColor })
}

export const line = (title:string, color:string, values:any, backgroundColor:any) => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 400,
    height: 100,
  })
  const option = {
    title: {
      show: true,
      top: 'center',
      left: 'center',
      textAlign: 'center',
      text: title,
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: isDark() ? '#fff' : '#333',
      },
    },
    grid: {
      top: 0,
      left: 10,
      bottom: 0,
      right: 0,
    },
    xAxis: {
      show: false,
    },
    yAxis: {
      show: false,
    },
    series: [
      {
        type: 'bar',
        color,
        data: [] as any,
        large: true,
      },
    ],
  }
  for (let i = 0; i < values.length; i++) {
    option.series[0].data.push([i, values[i] - values[0]])
  }
  chart.setOption(option)
  return chart.getDataURL({ backgroundColor })
}

export const bar = (title :string, color :string, value :any, backgroundColor:any) => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 400,
    height: 100,
  })
  const option = {
    title: {
      show: true,
      top: 'center',
      left: 'center',
      textAlign: 'center',
      text: title + ':' + value + '%',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        color: isDark() ? '#fff' : '#333',
      },
    },
    grid: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
    yAxis: {
      type: 'category',
      data: ['0'],
      show: false,
    },
    xAxis: {
      type: 'value',
      show: false,
      max: 100,
      min: 0,
    },
    series: [
      {
        data: [value],
        type: 'bar',
        color,
        smooth: true,
      },
    ],
  }
  chart.setOption(option)
  return chart.getDataURL({ backgroundColor })
}

const isDark = (): boolean => {
  const e = document.querySelector("html");
  return e != null && e.classList.contains("dark");
};

const COLOR_PRIMARY = '#00d2ff';

export const kpi = (
  title: string,
  text: string,
  value: number,
  color: string,
  values: number[] = [],
  dark: boolean = true,
  w: number = 220,
  h: number = 84
): string => {
  const accentColor = color || COLOR_PRIMARY;
  const safeWidth = Math.max(160, w);
  const safeHeight = Math.max(60, h);

  let valStr = text || `${Number(value || 0).toFixed(1)}`;
  let unitStr = '';

  const match = valStr.match(/^([0-9.,+-]+)\s*([a-zA-Z%°/]+.*)?$/);
  if (match) {
    valStr = match[1];
    unitStr = match[2] || '';
  }

  const borderColor = dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
  const titleColor = dark ? '#9ca3af' : '#64748b';
  const valueColor = dark ? '#f3f4f6' : '#0f172a';
  const unitColor = dark ? '#9ca3af' : '#64748b';

  const uid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
  const cardGradId = `cardGrad_${uid}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
    <defs>
      <linearGradient id="${cardGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${dark ? '#1a1d2d' : '#ffffff'}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="${dark ? '#0c0e14' : '#f1f5f9'}" stop-opacity="0.9" />
      </linearGradient>
    </defs>

    <rect x="0.5" y="0.5" width="${safeWidth - 1}" height="${safeHeight - 1}" rx="10" ry="10" fill="url(#${cardGradId})" stroke="${borderColor}" stroke-width="1" />
    <rect x="0" y="3" width="4" height="${safeHeight - 6}" rx="2" ry="2" fill="${accentColor}" />
    <text x="14" y="22" fill="${titleColor}" font-family="Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.05em">${escapeXml(title || 'METRIC')}</text>

    <g transform="translate(14, ${Math.round(safeHeight * 0.72)})">
      <text fill="${valueColor}" font-family="Roboto, sans-serif" font-size="${Math.min(32, Math.max(18, safeHeight * 0.42))}" font-weight="800">${escapeXml(valStr)}<tspan dx="5" font-size="${Math.min(14, Math.max(11, safeHeight * 0.22))}" font-weight="600" fill="${unitColor}">${escapeXml(unitStr)}</tspan></text>
    </g>
  </svg>`;

  return toSvgDataUrl(svg);
};

function toSvgDataUrl(svg: string): string {
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  } catch {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
